import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Play, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LibraryBook } from '../../api/books';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
import { BookCover } from './BookCover';
import { coverVariantForBook, pseudoPageCount } from './libraryUtils';
import { LIBRARY_UI } from './libraryTheme';

type LibraryFeaturedBookProps = {
  book: LibraryBook;
  onPress: () => void;
};

export function LibraryFeaturedBook({ book, onPress }: LibraryFeaturedBookProps) {
  const { t } = useTranslation('app');
  const variant = coverVariantForBook(book);
  const pages = book.pages ?? pseudoPageCount(book.id);
  const authorLine = book.author
    ? t('books.featuredAuthor', { author: book.author })
    : t('books.featuredEditorial');

  return (
    <LinearGradient
      colors={[LIBRARY_UI.navy2, LIBRARY_UI.navyDeep]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.card}
    >
      <View style={styles.blob} />
      <BookCover title={book.title} variant={variant} watermarkIcon={Star} size="md" />
      <View style={styles.body}>
        <View style={styles.pill}>
          <Star size={11} color="#2a2110" fill="#2a2110" strokeWidth={1.5} />
          <Text style={styles.pillText}>{t('books.editorsPick')}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author}>{authorLine}</Text>
        <View style={styles.metaRow}>
          {book.rating != null ? (
            <View style={styles.metaItem}>
              <Star size={12} color={LIBRARY_UI.goldLt} fill={LIBRARY_UI.goldLt} strokeWidth={0} />
              <NumText style={styles.metaText}>{book.rating.toFixed(1)}</NumText>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <FileText size={12} color="rgba(255,255,255,0.85)" strokeWidth={2} />
            <Text style={styles.metaText}>{t('books.pageCount', { count: pages })}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.readBtn, pressed && styles.pressed]}
        >
          <Play size={15} color="#2a2110" fill="#2a2110" strokeWidth={0} />
          <Text style={styles.readText}>{t('books.startReading')}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LIBRARY_UI.cardRadiusLg,
    padding: 18,
    flexDirection: 'row',
    gap: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226,201,127,0.16)',
    ...platformShadow({ color: LIBRARY_UI.navyDeep, offsetY: 22, opacity: 0.45, radius: 24, elevation: 5 }),
  },
  blob: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(194,154,78,0.28)',
  },
  body: {
    flex: 1,
    zIndex: 2,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: LIBRARY_UI.goldLt,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#2a2110',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#FFFFFF',
    marginTop: 9,
    lineHeight: 20,
  },
  author: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 9,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  readBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: LIBRARY_UI.goldLt,
  },
  readText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2a2110',
  },
  pressed: { opacity: 0.9 },
});
