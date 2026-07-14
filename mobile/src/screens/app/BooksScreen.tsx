import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { LibraryBook } from '../../api/books';
import { QueryStateView, Text } from '../../components';
import {
  LIBRARY_UI,
  LibraryContinueCard,
  LibraryFeaturedBook,
  LibraryHero,
  LibraryNotesList,
  LibrarySectionHeader,
  LibrarySubjectGrid,
  LibraryTopRatedShelf,
  mapSubjectCounts,
  mergeBookDownloadState,
  pickContinueBook,
  pickFeaturedBook,
  pickTopRatedBooks,
} from '../../components/library';
import {
  useBooks,
  useBookDownload,
  useLibrarySubjects,
  useLocalDownloadIds,
  useNetworkStatus,
} from '../../hooks';
import { useFocusRefetch } from '../../hooks/useFocusRefetch';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type BooksNav = NativeStackNavigationProp<MainStackParamList, 'Books'>;

function mergeBooks(
  items: LibraryBook[],
  localDownloadIds: ReadonlySet<string>,
): LibraryBook[] {
  return items.map((book) => mergeBookDownloadState(book, localDownloadIds));
}

export function BooksScreen() {
  const navigation = useNavigation<BooksNav>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { isOffline } = useNetworkStatus();
  const { localDownloadIds, refreshLocalDownloads } = useLocalDownloadIds();
  const isSearching = debouncedQuery.length > 0;

  const popularQuery = useBooks({
    sort: 'popular',
    limit: 20,
    ...(subjectFilter ? { subject: subjectFilter } : {}),
  });

  const notesQuery = useBooks({
    type: 'notes',
    sort: 'popular',
    limit: 20,
    ...(subjectFilter ? { subject: subjectFilter } : {}),
  });

  const searchQuery = useBooks(
    {
      q: debouncedQuery,
      limit: 20,
      ...(subjectFilter ? { subject: subjectFilter } : {}),
    },
    { enabled: isSearching },
  );

  const subjectsQuery = useLibrarySubjects();

  useFocusRefetch(() => {
    void popularQuery.refetch();
    void notesQuery.refetch();
    if (isSearching) {
      void searchQuery.refetch();
    }
    void subjectsQuery.refetch();
  });

  const activeBooksQuery = isSearching ? searchQuery : popularQuery;
  const books = useMemo(() => {
    const rawBooks = activeBooksQuery.data?.items ?? [];
    return mergeBooks(rawBooks, localDownloadIds);
  }, [activeBooksQuery.data?.items, localDownloadIds]);
  const noteBooks = useMemo(() => {
    const rawNoteBooks = notesQuery.data?.items ?? [];
    return mergeBooks(rawNoteBooks, localDownloadIds);
  }, [localDownloadIds, notesQuery.data?.items]);

  const visibleBooks = useMemo(() => {
    if (!showDownloadedOnly) {
      return books;
    }
    return books.filter((book) => book.isDownloaded);
  }, [books, showDownloadedOnly]);

  const visibleNoteBooks = useMemo(() => {
    if (!showDownloadedOnly) {
      return noteBooks;
    }
    return noteBooks.filter((book) => book.isDownloaded);
  }, [noteBooks, showDownloadedOnly]);

  const subjectGroups = useMemo(
    () => mapSubjectCounts(subjectsQuery.data?.subjects ?? []),
    [subjectsQuery.data?.subjects],
  );

  const continueBook = useMemo(() => pickContinueBook(visibleBooks), [visibleBooks]);
  const featuredBook = useMemo(() => pickFeaturedBook(visibleBooks), [visibleBooks]);
  const topRated = useMemo(() => pickTopRatedBooks(visibleBooks), [visibleBooks]);

  const downloadedCount = useMemo(() => {
    const merged = new Set<string>();
    books.forEach((book) => {
      if (book.isDownloaded) {
        merged.add(book.id);
      }
    });
    localDownloadIds.forEach((id) => merged.add(id));
    return merged.size;
  }, [books, localDownloadIds]);

  const readingCount = useMemo(
    () => books.filter((book) => book.inProgress).length,
    [books],
  );

  const { downloadBook, confirmDeleteDownload, isDownloading } = useBookDownload({
    onLocalChange: () => {
      void refreshLocalDownloads();
    },
  });

  const openBook = useCallback(
    (book: LibraryBook) => {
      navigation.navigate('BookReader', { bookId: book.id });
    },
    [navigation],
  );

  const toggleSubject = useCallback((subject: string) => {
    setSubjectFilter((current) => (current === subject ? null : subject));
    setShowDownloadedOnly(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSubjectFilter(null);
    setQuery('');
    setShowDownloadedOnly(false);
  }, []);

  const handleDownload = useCallback(
    (book: LibraryBook) => {
      void downloadBook(book.id);
    },
    [downloadBook],
  );

  const handleDeleteDownload = useCallback(
    (book: LibraryBook) => {
      confirmDeleteDownload(book.id, book.title);
    },
    [confirmDeleteDownload],
  );

  const isLoading =
    activeBooksQuery.isLoading ||
    subjectsQuery.isLoading ||
    (!isSearching && notesQuery.isLoading);
  const isError =
    activeBooksQuery.isError || subjectsQuery.isError || notesQuery.isError;
  const hasCatalogData =
    visibleBooks.length > 0 ||
    visibleNoteBooks.length > 0 ||
    subjectGroups.length > 0 ||
    downloadedCount > 0;

  const retryAll = useCallback(() => {
    void activeBooksQuery.refetch();
    void subjectsQuery.refetch();
    void notesQuery.refetch();
  }, [activeBooksQuery, notesQuery, subjectsQuery]);

  const showBrowseEmpty =
    !isSearching && !isLoading && !visibleBooks.length && !visibleNoteBooks.length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LibraryHero
        booksCount={activeBooksQuery.data?.total ?? books.length}
        downloadedCount={downloadedCount}
        readingCount={readingCount}
        query={query}
        onQueryChange={setQuery}
        onBack={() => navigation.goBack()}
        onSavedPress={() => setShowDownloadedOnly((current) => !current)}
        savedActive={showDownloadedOnly}
      />

      <View style={styles.body}>
        <QueryStateView
          isLoading={isLoading}
          isError={isError}
          isFetching={activeBooksQuery.isFetching || subjectsQuery.isFetching}
          isOffline={isOffline}
          hasData={hasCatalogData}
          onRetry={retryAll}
        >
          {showDownloadedOnly ? (
            <>
              <LibrarySectionHeader title={t('books.downloadedSection')} />
              {visibleBooks.length > 0 || visibleNoteBooks.length > 0 ? (
                <LibraryTopRatedShelf
                  books={[...visibleBooks, ...visibleNoteBooks]}
                  onBookPress={openBook}
                />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>{t('books.downloadedEmptyTitle')}</Text>
                  <Text style={styles.emptyBody}>{t('books.downloadedEmptyBody')}</Text>
                </View>
              )}
            </>
          ) : null}

          {isSearching ? (
            <>
              <LibrarySectionHeader title={t('books.searchResults')} />
              {visibleBooks.length > 0 ? (
                <LibraryTopRatedShelf books={visibleBooks} onBookPress={openBook} />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>{t('books.emptyTitle')}</Text>
                  <Text style={styles.emptyBody}>{t('books.emptyBody')}</Text>
                </View>
              )}
            </>
          ) : showDownloadedOnly ? null : (
            <>
              {continueBook ? (
                <>
                  <LibrarySectionHeader title={t('books.continueReading')} />
                  <LibraryContinueCard book={continueBook} onPress={() => openBook(continueBook)} />
                </>
              ) : null}

              {featuredBook ? (
                <>
                  <LibrarySectionHeader title={t('books.bookOfWeek')} />
                  <LibraryFeaturedBook book={featuredBook} onPress={() => openBook(featuredBook)} />
                </>
              ) : null}

              {subjectGroups.length > 0 ? (
                <>
                  <LibrarySectionHeader title={t('books.browseSubject')} />
                  <LibrarySubjectGrid
                    groups={subjectGroups}
                    activeSubject={subjectFilter}
                    onSubjectPress={toggleSubject}
                  />
                </>
              ) : null}

              {topRated.length > 0 ? (
                <>
                  <LibrarySectionHeader
                    title={t('books.topRated')}
                    actionLabel={t('books.viewAll')}
                    onActionPress={clearFilters}
                  />
                  <LibraryTopRatedShelf books={topRated} onBookPress={openBook} />
                </>
              ) : null}

              {visibleNoteBooks.length > 0 ? (
                <>
                  <LibrarySectionHeader
                    title={t('books.freeNotes')}
                    actionLabel={t('books.viewAll')}
                    onActionPress={clearFilters}
                  />
                  <LibraryNotesList
                    books={visibleNoteBooks}
                    onOpen={openBook}
                    onDownload={handleDownload}
                    onDeleteDownload={handleDeleteDownload}
                    isDownloading={isDownloading}
                  />
                </>
              ) : null}

              {showBrowseEmpty ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>{t('books.emptyTitle')}</Text>
                  <Text style={styles.emptyBody}>{t('books.emptyBody')}</Text>
                </View>
              ) : null}
            </>
          )}
        </QueryStateView>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: LIBRARY_UI.bg,
    },
    content: {
      paddingBottom: bottomInset + theme.spacing['4xl'],
    },
    body: {
      paddingHorizontal: LIBRARY_UI.horizontalPad,
    },
    empty: {
      marginTop: 12,
      padding: 20,
      borderRadius: LIBRARY_UI.cardRadius,
      backgroundColor: LIBRARY_UI.surface,
      borderWidth: 1,
      borderColor: LIBRARY_UI.line,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: LIBRARY_UI.ink,
    },
    emptyBody: {
      fontSize: 13,
      fontWeight: '600',
      color: LIBRARY_UI.muted,
      lineHeight: 19,
    },
  });
}
