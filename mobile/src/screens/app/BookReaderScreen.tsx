import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTranslation } from 'react-i18next';
import { QueryStateView, Text, Button } from '../../components';
import {
  READER_THEMES,
  ReaderBottomBar,
  ReaderExplainSheet,
  ReaderListenPlayer,
  ReaderMenuSheet,
  ReaderPageContent,
  ReaderSelectionToolbar,
  ReaderTopBar,
  type ReaderThemeTokens,
} from '../../components/reader';
import { useReadAloud } from '../../features/reader';
import { trackLibraryEvent } from '../../analytics/libraryAnalytics';
import { useBookReader } from '../../hooks/useBookReader';
import { useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useReaderSettings } from '../../store/readerSettings';

type ReaderRoute = RouteProp<MainStackParamList, 'BookReader'>;
type ReaderNav = NativeStackNavigationProp<MainStackParamList, 'BookReader'>;

export function BookReaderScreen() {
  const route = useRoute<ReaderRoute>();
  const navigation = useNavigation<ReaderNav>();
  const { width } = useWindowDimensions();
  const { t } = useTranslation('app');
  const { isOffline } = useNetworkStatus();
  const pagerRef = useRef<PagerView>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainPassage, setExplainPassage] = useState<{ page: number; text: string } | null>(null);

  const {
    theme: readerThemeId,
    fontScale,
    lineSpacing,
    setTheme,
    increaseFont,
    decreaseFont,
    cycleLineSpacing,
    toggleHighlight,
    isHighlighted,
  } = useReaderSettings();

  const readerTheme = READER_THEMES[readerThemeId];

  const {
    book,
    accessiblePages,
    totalPageCount,
    currentChapterTitle,
    currentPageOrder,
    pageIndex,
    focusLine,
    progressPercent,
    selection,
    setSelection,
    setFocusLine,
    goToPageOrder,
    handlePageSelected,
    hasLockedContent,
    hasReaderContent,
    isOfflineBundle,
    offlineUnavailable,
    isLoading,
    isError,
    retry,
    bookmarkMutation,
    savedProgress,
    saveProgressNow,
    prefetchNextChapter,
  } = useBookReader(route.params.bookId, {
    startPage: route.params.startPage,
    startLine: route.params.startLine,
  });

  const styles = useMemo(() => createStyles(readerTheme), [readerTheme]);

  const readAloud = useReadAloud({
    bookId: route.params.bookId,
    pages: accessiblePages,
    totalPageCount,
    savedProgress,
    onNavigateToPage: goToPageOrder,
    onSaveProgress: saveProgressNow,
    prefetchChapter: prefetchNextChapter,
  });

  const handleExplain = useCallback(() => {
    if (!selection?.text) {
      return;
    }

    setExplainPassage({ page: selection.pageOrder, text: selection.text });
    setExplainOpen(true);
    setSelection(null);
  }, [selection, setSelection]);

  const handleReadFromHere = useCallback(() => {
    if (!selection) {
      return;
    }

    readAloud.playFrom({ pageOrder: selection.pageOrder, line: selection.line });
    setSelection(null);
  }, [readAloud, selection, setSelection]);

  const handleListen = useCallback(() => {
    if (readAloud.isActive && readAloud.status === 'paused') {
      readAloud.resume();
      return;
    }

    if (readAloud.isActive) {
      readAloud.play();
      return;
    }

    readAloud.playFromCurrentPage(currentPageOrder || 1);
  }, [currentPageOrder, readAloud]);

  const handleToggleListenPlay = useCallback(() => {
    if (readAloud.status === 'playing') {
      void readAloud.pause();
      return;
    }

    readAloud.resume();
  }, [readAloud]);

  const handleBookmark = useCallback(() => {
    if (!selection) {
      return;
    }

    bookmarkMutation.mutate(
      {
        page: selection.pageOrder,
        line: selection.line,
        note: selection.text.slice(0, 240),
      },
      {
        onSuccess: () => setSelection(null),
      },
    );
  }, [bookmarkMutation, selection, setSelection]);

  const handleHighlight = useCallback(() => {
    if (!selection) {
      return;
    }

    toggleHighlight(route.params.bookId, selection.pageOrder, selection.line);
    setSelection(null);
  }, [route.params.bookId, selection, setSelection, toggleHighlight]);

  const handlePageChange = useCallback(
    (event: { nativeEvent: { position: number } }) => {
      handlePageSelected(event.nativeEvent.position);
    },
    [handlePageSelected],
  );

  useEffect(() => {
    pagerRef.current?.setPage(pageIndex);
  }, [pageIndex]);

  const checkHighlighted = useCallback(
    (line: number) => isHighlighted(route.params.bookId, currentPageOrder, line),
    [currentPageOrder, isHighlighted, route.params.bookId],
  );

  useEffect(() => {
    void trackLibraryEvent('book_open', route.params.bookId, {
      offline: isOfflineBundle,
    });
  }, [isOfflineBundle, route.params.bookId]);

  const lastTrackedPage = useRef<number | null>(null);
  useEffect(() => {
    if (!currentPageOrder || lastTrackedPage.current === currentPageOrder) {
      return;
    }
    lastTrackedPage.current = currentPageOrder;
    void trackLibraryEvent('page_read', route.params.bookId, { page: currentPageOrder });
  }, [currentPageOrder, route.params.bookId]);

  useEffect(() => {
    return () => {
      readAloud.stop();
    };
  }, [readAloud]);

  return (
    <View style={styles.screen}>
      <ReaderTopBar
        title={book?.title ?? t('reader.loadingTitle')}
        theme={readerTheme}
        onBack={() => navigation.goBack()}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <QueryStateView
        isLoading={isLoading}
        isError={isError && !offlineUnavailable}
        isFetching={false}
        isOffline={isOffline}
        hasData={hasReaderContent}
        onRetry={retry}
      >
        {offlineUnavailable ? (
          <View style={styles.offlineWrap}>
            <Text style={styles.offlineTitle}>{t('reader.offlineTitle')}</Text>
            <Text style={styles.offlineBody}>{t('reader.offlineBody')}</Text>
            <Button label={t('reader.offlineBack')} onPress={() => navigation.goBack()} />
          </View>
        ) : accessiblePages.length > 0 ? (
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={pageIndex}
            pageMargin={0}
            onPageSelected={handlePageChange}
            key={`${route.params.bookId}-${accessiblePages.length}`}
          >
            {accessiblePages.map((page) => (
              <View key={page.id} style={[styles.page, { width }]}>
                <ReaderPageContent
                  html={page.html}
                  theme={readerTheme}
                  fontScale={fontScale}
                  lineSpacing={lineSpacing}
                  pageOrder={page.order}
                  bookId={route.params.bookId}
                  focusLine={page.order === currentPageOrder ? focusLine : undefined}
                  readAloudLine={
                    readAloud.isActive && page.order === readAloud.position.pageOrder
                      ? readAloud.position.line
                      : null
                  }
                  readAloudCharIndex={
                    page.order === readAloud.position.pageOrder
                      ? readAloud.position.charIndex
                      : 0
                  }
                  isHighlighted={(line) => isHighlighted(route.params.bookId, page.order, line)}
                  onSelectLine={(line, text) => {
                    if (page.order !== currentPageOrder) {
                      handlePageSelected(accessiblePages.findIndex((item) => item.id === page.id));
                    }
                    setFocusLine(line);
                    setSelection({ pageOrder: page.order, line, text });
                  }}
                />
              </View>
            ))}
          </PagerView>
        ) : (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={readerTheme.accent} />
          </View>
        )}
      </QueryStateView>

      {hasLockedContent ? (
        <View style={styles.previewBanner}>
          <View style={styles.previewDot} />
        </View>
      ) : null}

      <ReaderListenPlayer
        visible={readAloud.isActive}
        collapsed={readAloud.collapsed}
        bookTitle={book?.title ?? t('reader.loadingTitle')}
        chapterTitle={readAloud.current?.chapterTitle ?? currentChapterTitle}
        status={readAloud.status}
        speed={readAloud.speed}
        chapterPercent={readAloud.chapterProgress.percent}
        theme={readerTheme}
        onToggleCollapsed={() => readAloud.setCollapsed(!readAloud.collapsed)}
        onPrevious={readAloud.previous}
        onNext={readAloud.next}
        onTogglePlay={handleToggleListenPlay}
        onCycleSpeed={readAloud.cycleSpeed}
        onStop={readAloud.stop}
      />

      {hasReaderContent ? (
        <ReaderBottomBar
          chapterTitle={currentChapterTitle}
          pageOrder={currentPageOrder || 1}
          totalPages={totalPageCount}
          progressPercent={progressPercent}
          theme={readerTheme}
        />
      ) : null}

      {selection ? (
        <ReaderSelectionToolbar
          theme={readerTheme}
          onExplain={handleExplain}
          onReadFromHere={handleReadFromHere}
          onBookmark={handleBookmark}
          onHighlight={handleHighlight}
          onDismiss={() => setSelection(null)}
          isHighlighted={checkHighlighted(selection.line)}
          isBookmarking={bookmarkMutation.isPending}
        />
      ) : null}

      <ReaderMenuSheet
        visible={menuOpen}
        theme={readerTheme}
        readerTheme={readerThemeId}
        fontScale={fontScale}
        lineSpacing={lineSpacing}
        onClose={() => setMenuOpen(false)}
        onThemeChange={setTheme}
        onIncreaseFont={increaseFont}
        onDecreaseFont={decreaseFont}
        onCycleLineSpacing={cycleLineSpacing}
        onListen={handleListen}
        isListening={readAloud.isActive}
      />

      {explainPassage ? (
        <ReaderExplainSheet
          visible={explainOpen}
          bookId={route.params.bookId}
          page={explainPassage.page}
          passage={explainPassage.text}
          theme={readerTheme}
          onClose={() => {
            setExplainOpen(false);
            setExplainPassage(null);
          }}
        />
      ) : null}
    </View>
  );
}

function createStyles(theme: ReaderThemeTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    pager: {
      flex: 1,
    },
    page: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    offlineWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 12,
    },
    offlineTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
    },
    offlineBody: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    previewBanner: {
      position: 'absolute',
      right: 18,
      bottom: 96,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
  });
}
