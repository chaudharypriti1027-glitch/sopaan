import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createBookmark,
  getBookReader,
  upsertReadingProgress,
  type LibraryPage,
} from '../api/books';
import { READER_PRO_PREVIEW_PAGES } from '../components/reader/readerTheme';
import { useProGate } from './useProGate';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineBookBundle } from './useOfflineBookBundle';
import {
  getOfflineReadingProgress,
  saveOfflineReadingProgress,
} from '../offline/readingProgressStore';
import { queryKeys } from './queryKeys';

export type ReaderFlatPage = LibraryPage & {
  chapterId: string;
  chapterTitle: string;
};

export type ReaderSelection = {
  pageOrder: number;
  line: number;
  text: string;
};

const PROGRESS_DEBOUNCE_MS = 5000;

function flatPagesFromBundle(
  pages: {
    id: string;
    order: number;
    chapterId: string;
    chapterTitle: string;
    html: string;
  }[],
): ReaderFlatPage[] {
  return [...pages]
    .map((page) => ({
      id: page.id,
      order: page.order,
      html: page.html,
      chapterId: page.chapterId,
      chapterTitle: page.chapterTitle,
    }))
    .sort((a, b) => a.order - b.order);
}

function clampPageIndex(index: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, total - 1));
}

export function useBookReader(
  bookId: string,
  options?: { startPage?: number; startLine?: number },
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('app');
  const { openPaywall } = useProGate();
  const { isOffline } = useNetworkStatus();
  const { bundle: offlineBundle, isLoading: offlineBundleLoading, hasLocalBundle } =
    useOfflineBookBundle(bookId);
  const useLocalBundle = hasLocalBundle;
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedProgress = useRef<string | null>(null);

  const [offlineProgress, setOfflineProgress] = useState<{
    lastPage: number;
    lastLine: number;
    percent: number;
  } | null>(null);

  const readerQuery = useQuery({
    queryKey: queryKeys.books.reader(bookId),
    queryFn: () => getBookReader(bookId),
    enabled: Boolean(bookId && !useLocalBundle && !isOffline),
    staleTime: 5 * 60_000,
    retry: 2,
  });

  useEffect(() => {
    if (!bookId || !isOffline) {
      return;
    }

    void getOfflineReadingProgress(bookId).then((progress) => {
      if (progress) {
        setOfflineProgress({
          lastPage: progress.lastPage,
          lastLine: progress.lastLine,
          percent: progress.percent,
        });
      }
    });
  }, [bookId, isOffline]);

  const book =
    readerQuery.data?.book ??
    (useLocalBundle ? offlineBundle?.book : undefined);
  const chapters = useLocalBundle
    ? (offlineBundle?.chapters ?? [])
    : (readerQuery.data?.chapters ?? []);
  const savedProgress = readerQuery.data?.progress ?? offlineProgress;

  const allPages = useMemo(() => {
    if (useLocalBundle && offlineBundle?.pages?.length) {
      return flatPagesFromBundle(offlineBundle.pages);
    }
    return readerQuery.data?.pages ?? [];
  }, [offlineBundle?.pages, readerQuery.data?.pages, useLocalBundle]);

  const hasLockedContent = useLocalBundle ? false : Boolean(readerQuery.data?.locked);
  const accessiblePages = allPages;
  const totalPageCount =
    readerQuery.data?.totalPages ??
    allPages.length ??
    book?.pages ??
    0;

  const resumePage = options?.startPage ?? savedProgress?.lastPage ?? accessiblePages[0]?.order ?? 1;
  const resumeLine = options?.startLine ?? savedProgress?.lastLine ?? 0;

  const initialIndex = useMemo(() => {
    const found = accessiblePages.findIndex((page) => page.order >= resumePage);
    return clampPageIndex(found >= 0 ? found : 0, accessiblePages.length);
  }, [accessiblePages, resumePage]);

  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [focusLine, setFocusLine] = useState(resumeLine);
  const [selection, setSelection] = useState<ReaderSelection | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && accessiblePages.length > 0) {
      setPageIndex(initialIndex);
      setFocusLine(resumeLine);
      initialized.current = true;
    }
  }, [accessiblePages.length, initialIndex, resumeLine]);

  const currentPage = accessiblePages[pageIndex];
  const currentChapterTitle = currentPage?.chapterTitle ?? chapters[0]?.title ?? '';
  const currentPageOrder = currentPage?.order ?? 0;
  const progressPercent = totalPageCount
    ? Math.min(100, Math.round((currentPageOrder / totalPageCount) * 100))
    : 0;

  const progressMutation = useMutation({
    mutationFn: (body: { page: number; line?: number; percent?: number }) =>
      upsertReadingProgress(bookId, body),
    onSuccess: () => {
      if (isOffline) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.reader(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.detail(bookId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });

  const scheduleProgressSave = useCallback(
    (page: number, line: number) => {
      if (!bookId || page <= 0 || isOffline) {
        if (isOffline && page > 0) {
          void saveOfflineReadingProgress(bookId, {
            page,
            line,
            percent: progressPercent,
          }).then(() => {
            setOfflineProgress({ lastPage: page, lastLine: line, percent: progressPercent });
          });
        }
        return;
      }

      const signature = `${page}:${line}:${progressPercent}`;
      if (lastSavedProgress.current === signature) {
        return;
      }

      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }

      progressTimer.current = setTimeout(() => {
        lastSavedProgress.current = signature;
        progressMutation.mutate({ page, line, percent: progressPercent });
      }, PROGRESS_DEBOUNCE_MS);
    },
    [bookId, isOffline, progressMutation, progressPercent],
  );

  useEffect(() => {
    if (!currentPageOrder) {
      return;
    }
    scheduleProgressSave(currentPageOrder, focusLine);
    return () => {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }
    };
  }, [currentPageOrder, focusLine, scheduleProgressSave]);

  const showProPaywall = useCallback(() => {
    openPaywall({
      paywallTitle: t('reader.unlockTitle'),
      paywallMessage: t('reader.unlockMessage'),
    });
  }, [openPaywall, t]);

  const goToPageIndex = useCallback(
    (nextIndex: number) => {
      const clamped = clampPageIndex(nextIndex, accessiblePages.length);
      const nextPage = accessiblePages[clamped];
      if (!nextPage) {
        return;
      }

      setPageIndex(clamped);
      setFocusLine(0);
      setSelection(null);
    },
    [accessiblePages],
  );

  const goToPageOrder = useCallback(
    (pageOrder: number, line = 0) => {
      const index = accessiblePages.findIndex((page) => page.order === pageOrder);
      if (index < 0) {
        if (hasLockedContent && pageOrder > READER_PRO_PREVIEW_PAGES) {
          showProPaywall();
        }
        return;
      }

      setPageIndex(index);
      setFocusLine(line);
      setSelection(null);
    },
    [accessiblePages, hasLockedContent, showProPaywall],
  );

  const handlePageSelected = useCallback(
    (nextIndex: number) => {
      if (hasLockedContent && nextIndex >= accessiblePages.length) {
        showProPaywall();
        return;
      }
      goToPageIndex(nextIndex);
    },
    [accessiblePages.length, goToPageIndex, hasLockedContent, showProPaywall],
  );

  const bookmarkMutation = useMutation({
    mutationFn: (body: { page: number; line: number; note: string }) =>
      createBookmark(bookId, body),
  });

  const saveProgressNow = useCallback(
    (page: number, line: number) => {
      if (!bookId || page <= 0) {
        return;
      }

      const percent = totalPageCount
        ? Math.min(100, Math.round((page / totalPageCount) * 100))
        : 0;

      lastSavedProgress.current = `${page}:${line}:${percent}`;

      if (isOffline) {
        void saveOfflineReadingProgress(bookId, { page, line, percent }).then(() => {
          setOfflineProgress({ lastPage: page, lastLine: line, percent });
        });
        return;
      }

      progressMutation.mutate({ page, line, percent });
    },
    [bookId, isOffline, progressMutation, totalPageCount],
  );

  const retry = useCallback(() => {
    if (!useLocalBundle) {
      void readerQuery.refetch();
    }
  }, [readerQuery, useLocalBundle]);

  const offlineUnavailable = isOffline && !useLocalBundle;
  const hasReaderContent = accessiblePages.length > 0;

  return {
    book,
    chapters,
    accessiblePages,
    totalPageCount,
    savedProgress,
    currentPage,
    currentChapterTitle,
    currentPageOrder,
    pageIndex,
    focusLine,
    progressPercent,
    selection,
    setSelection,
    setFocusLine,
    goToPageIndex,
    goToPageOrder,
    handlePageSelected,
    hasLockedContent,
    hasReaderContent,
    isOfflineBundle: useLocalBundle,
    offlineUnavailable,
    isLoading:
      offlineBundleLoading ||
      (isOffline && !useLocalBundle) ||
      (!useLocalBundle && readerQuery.isLoading),
    isError:
      offlineUnavailable ||
      (!useLocalBundle &&
        (readerQuery.isError ||
          (readerQuery.isSuccess && !hasReaderContent && !readerQuery.isFetching))),
    retry,
    bookmarkMutation,
    progressMutation,
    saveProgressNow,
    prefetchNextChapter: () => {},
  };
}
