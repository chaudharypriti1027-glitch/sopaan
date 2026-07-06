import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LibraryBook } from '../../api/books';
import { Text } from '../Text';
import { resolveTestSubjectIcon } from '../home/homeUtils';
import {
  isDownloadedBook,
  pseudoFileSizeMb,
  pseudoPageCount,
  subjectToneForLabel,
} from './libraryUtils';
import { SUBJECT_TONE, LIBRARY_UI, libraryCard } from './libraryTheme';

type LibraryNotesListProps = {
  books: LibraryBook[];
  onOpen: (book: LibraryBook) => void;
  onDownload: (book: LibraryBook) => void;
  onDeleteDownload: (book: LibraryBook) => void;
  isDownloading?: (bookId: string) => boolean;
};

export function LibraryNotesList({
  books,
  onOpen,
  onDownload,
  onDeleteDownload,
  isDownloading,
}: LibraryNotesListProps) {
  const { t } = useTranslation('app');
  if (!books.length) return null;

  return (
    <View style={styles.card}>
      {books.map((book, index) => {
        const tone = subjectToneForLabel(book.subject ?? book.title, index);
        const colors = SUBJECT_TONE[tone];
        const Icon = resolveTestSubjectIcon(book.subject, book.title);
        const downloaded = isDownloadedBook(book);
        const downloading = isDownloading?.(book.id) ?? false;
        const pages = book.pages ?? pseudoPageCount(book.id);
        const size = pseudoFileSizeMb(book.id);
        const isNew = index === 0;

        return (
          <View key={book.id} style={[styles.row, index > 0 && styles.rowBorder]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
              <Icon size={21} color={colors.fg} strokeWidth={2} />
              <View style={styles.extBadge}>
                <Text style={styles.extText}>PDF</Text>
              </View>
            </View>

            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.meta}>
                {isNew ? (
                  <>
                    <Text style={styles.metaAccent}>{t('books.new')}</Text>
                    {' · '}
                  </>
                ) : null}
                {t('books.noteMeta', { pages, size })}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                downloaded
                  ? t('books.downloadedCheck')
                  : downloading
                    ? t('books.downloading')
                    : t('books.download')
              }
              accessibilityHint={
                downloaded ? t('books.downloadedHint') : t('books.downloadHint')
              }
              onPress={() => {
                if (downloading) {
                  return;
                }
                if (downloaded) {
                  onOpen(book);
                  return;
                }
                onDownload(book);
              }}
              onLongPress={() => {
                if (downloaded) {
                  onDeleteDownload(book);
                }
              }}
              style={({ pressed }) => [
                styles.action,
                downloaded ? styles.actionDone : styles.actionDefault,
                pressed && styles.pressed,
              ]}
            >
              {downloaded ? (
                <Check size={19} color={LIBRARY_UI.sageDeep} strokeWidth={2.2} />
              ) : (
                <Download size={19} color={LIBRARY_UI.navy} strokeWidth={2} />
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    ...libraryCard({ borderRadius: LIBRARY_UI.cardRadius }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: LIBRARY_UI.hair,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  extBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: LIBRARY_UI.red,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  extText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: LIBRARY_UI.ink,
  },
  meta: {
    fontSize: 10.5,
    fontWeight: '600',
    color: LIBRARY_UI.muted,
    marginTop: 3,
  },
  metaAccent: {
    color: LIBRARY_UI.goldDeep,
    fontWeight: '800',
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDefault: {
    backgroundColor: LIBRARY_UI.navySoft,
  },
  actionDone: {
    backgroundColor: LIBRARY_UI.sageSoft,
  },
  pressed: { opacity: 0.9 },
});
