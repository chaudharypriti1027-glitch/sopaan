import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { trackLibraryEvent } from '../../analytics/libraryAnalytics';
import type { ReaderFlatPage } from '../../hooks/useBookReader';
import { configureReadAloudAudioSession, stopAllSpeech } from './readAloudAudio';
import {
  buildReadAloudQueue,
  getChapterProgress,
  type ReadAloudSentence,
} from './readAloudQueue';
import {
  READ_ALOUD_SPEED_PRESETS,
  type ReadAloudPosition,
  type ReadAloudSpeedPreset,
  type ReadAloudStatus,
} from './readAloudTypes';

type UseReadAloudOptions = {
  bookId: string;
  pages: ReaderFlatPage[];
  totalPageCount: number;
  savedProgress?: { lastPage: number; lastLine: number } | null;
  onNavigateToPage: (pageOrder: number, line: number) => void;
  onSaveProgress: (page: number, line: number, percent: number) => void;
  prefetchChapter?: (chapterId: string) => void;
};

export function useReadAloud({
  bookId,
  pages,
  totalPageCount,
  savedProgress,
  onNavigateToPage,
  onSaveProgress,
  prefetchChapter,
}: UseReadAloudOptions) {
  const [status, setStatus] = useState<ReadAloudStatus>('idle');
  const [idx, setIdx] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [position, setPosition] = useState<ReadAloudPosition>({
    pageOrder: 0,
    line: 0,
    charIndex: 0,
  });

  const queueRef = useRef<ReadAloudSentence[]>([]);
  const idxRef = useRef(0);
  const statusRef = useRef<ReadAloudStatus>('idle');
  const speakingRef = useRef(false);
  const lastProgressRef = useRef<string | null>(null);

  const speed = READ_ALOUD_SPEED_PRESETS[speedIndex] ?? READ_ALOUD_SPEED_PRESETS[1];

  const current = queueRef.current[idx] ?? null;

  const chapterProgress = useMemo(
    () => getChapterProgress(queueRef.current, idx, current?.chapterId),
    // queueLength invalidates progress when the read-aloud queue is rebuilt.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queueLength is an intentional cache buster
    [current?.chapterId, idx, queueLength],
  );

  const syncPosition = useCallback((sentence: ReadAloudSentence | null, charIndex = 0) => {
    if (!sentence) {
      return;
    }

    setPosition({
      pageOrder: sentence.pageOrder,
      line: sentence.line,
      charIndex,
    });
    onNavigateToPage(sentence.pageOrder, sentence.line);
  }, [onNavigateToPage]);

  const persistProgress = useCallback(
    (sentence: ReadAloudSentence | null) => {
      if (!sentence) {
        return;
      }

      const signature = `${sentence.pageOrder}:${sentence.line}`;
      if (lastProgressRef.current === signature) {
        return;
      }

      lastProgressRef.current = signature;
      const percent = totalPageCount
        ? Math.min(100, Math.round((sentence.pageOrder / totalPageCount) * 100))
        : 0;
      onSaveProgress(sentence.pageOrder, sentence.line, percent);
    },
    [onSaveProgress, totalPageCount],
  );

  const maybePrefetch = useCallback(
    (sentence: ReadAloudSentence | null) => {
      if (!sentence || !prefetchChapter) {
        return;
      }

      const pageIndex = pages.findIndex((page) => page.order === sentence.pageOrder);
      if (pageIndex < 0) {
        return;
      }

      const chapterPages = pages.filter((page) => page.chapterId === sentence.chapterId);
      const idxInChapter = chapterPages.findIndex((page) => page.order === sentence.pageOrder);
      if (idxInChapter < chapterPages.length - 2) {
        return;
      }

      const nextChapterPage = pages.find(
        (page, index) => index > pageIndex && page.chapterId !== sentence.chapterId,
      );
      if (nextChapterPage) {
        prefetchChapter(nextChapterPage.chapterId);
      }
    },
    [pages, prefetchChapter],
  );

  const speakCurrent = useCallback(async () => {
    const sentence = queueRef.current[idxRef.current];
    if (!sentence || statusRef.current === 'paused') {
      return;
    }

    speakingRef.current = true;
    syncPosition(sentence, 0);
    persistProgress(sentence);
    maybePrefetch(sentence);

    await configureReadAloudAudioSession();
    stopAllSpeech();

    Speech.speak(sentence.text, {
      language: 'en-IN',
      rate: speed.rate,
      pitch: speed.pitch,
      onBoundary: Platform.OS === 'ios'
        ? (event: { charIndex: number; charLength: number }) => {
            setPosition((prev) => ({
              ...prev,
              pageOrder: sentence.pageOrder,
              line: sentence.line,
              charIndex: event.charIndex,
            }));
          }
        : undefined,
      onDone: () => {
        speakingRef.current = false;
        if (statusRef.current !== 'playing') {
          return;
        }

        const nextIdx = idxRef.current + 1;
        if (nextIdx >= queueRef.current.length) {
          statusRef.current = 'idle';
          setStatus('idle');
          setIdx(nextIdx);
          idxRef.current = nextIdx;
          return;
        }

        idxRef.current = nextIdx;
        setIdx(nextIdx);
      },
      onStopped: () => {
        speakingRef.current = false;
      },
      onError: () => {
        speakingRef.current = false;
        statusRef.current = 'idle';
        setStatus('idle');
      },
    });
  }, [maybePrefetch, persistProgress, speed.pitch, speed.rate, syncPosition]);

  useEffect(() => {
    if (status !== 'playing' || speakingRef.current) {
      return;
    }

    void speakCurrent();
  }, [idx, speedIndex, status, speakCurrent]);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, [bookId]);

  const loadQueue = useCallback(
    (start: { pageOrder: number; line: number }) => {
      queueRef.current = buildReadAloudQueue(pages, start);
      idxRef.current = 0;
      setIdx(0);
      setQueueLength(queueRef.current.length);
      return queueRef.current.length;
    },
    [pages],
  );

  const playFrom = useCallback(
    (start: { pageOrder: number; line: number }) => {
      const count = loadQueue(start);
      if (count <= 0) {
        return false;
      }

      statusRef.current = 'playing';
      setStatus('playing');
      setCollapsed(false);
      void trackLibraryEvent('read_aloud_start', bookId, {
        pageOrder: start.pageOrder,
        line: start.line,
      });
      return true;
    },
    [bookId, loadQueue],
  );

  const play = useCallback(() => {
    if (queueRef.current.length === 0) {
      const startPage = savedProgress?.lastPage ?? pages[0]?.order ?? 1;
      const startLine = savedProgress?.lastLine ?? 0;
      return playFrom({ pageOrder: startPage, line: startLine });
    }

    statusRef.current = 'playing';
    setStatus('playing');
    if (!speakingRef.current) {
      void speakCurrent();
    } else if (Platform.OS === 'ios') {
      void Speech.resume();
    }
    return true;
  }, [pages, playFrom, savedProgress?.lastLine, savedProgress?.lastPage, speakCurrent]);

  const playFromCurrentPage = useCallback(
    (currentPageOrder: number) => {
      if (savedProgress?.lastPage) {
        return playFrom({
          pageOrder: savedProgress.lastPage,
          line: savedProgress.lastLine ?? 0,
        });
      }

      return playFrom({ pageOrder: currentPageOrder, line: 0 });
    },
    [playFrom, savedProgress?.lastLine, savedProgress?.lastPage],
  );

  const pause = useCallback(async () => {
    statusRef.current = 'paused';
    setStatus('paused');
    if (Platform.OS === 'ios') {
      await Speech.pause();
      return;
    }
    stopAllSpeech();
  }, []);

  const resume = useCallback(() => {
    statusRef.current = 'playing';
    setStatus('playing');
    if (Platform.OS === 'ios') {
      void Speech.resume();
      return;
    }
    void speakCurrent();
  }, [speakCurrent]);

  const stop = useCallback(() => {
    statusRef.current = 'idle';
    setStatus('idle');
    stopAllSpeech();
    speakingRef.current = false;
    queueRef.current = [];
    idxRef.current = 0;
    setIdx(0);
    setQueueLength(0);
    setPosition({ pageOrder: 0, line: 0, charIndex: 0 });
  }, []);

  const next = useCallback(() => {
    if (idxRef.current >= queueRef.current.length - 1) {
      return;
    }

    stopAllSpeech();
    speakingRef.current = false;
    idxRef.current += 1;
    setIdx(idxRef.current);
    statusRef.current = 'playing';
    setStatus('playing');
  }, []);

  const previous = useCallback(() => {
    if (idxRef.current <= 0) {
      return;
    }

    stopAllSpeech();
    speakingRef.current = false;
    idxRef.current -= 1;
    setIdx(idxRef.current);
    statusRef.current = 'playing';
    setStatus('playing');
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((currentIndex) => (currentIndex + 1) % READ_ALOUD_SPEED_PRESETS.length);
    if (statusRef.current === 'playing') {
      stopAllSpeech();
      speakingRef.current = false;
      void speakCurrent();
    }
  }, [speakCurrent]);

  return {
    status,
    collapsed,
    setCollapsed,
    current,
    position,
    idx,
    queueLength,
    chapterProgress,
    speed,
    cycleSpeed,
    play,
    playFrom,
    playFromCurrentPage,
    pause,
    resume,
    stop,
    next,
    previous,
    isActive: status !== 'idle',
  };
}

export { READ_ALOUD_SPEED_PRESETS };
export type { ReadAloudSpeedPreset, ReadAloudStatus, ReadAloudPosition };
