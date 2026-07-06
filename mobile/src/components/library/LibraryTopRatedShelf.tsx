import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LibraryBook } from '../../api/books';
import { NumText } from '../NumText';
import { Text } from '../Text';
import { resolveTestSubjectIcon } from '../home/homeUtils';
import { BookCover } from './BookCover';
import { coverVariantForBook, isProBook } from './libraryUtils';
import { LIBRARY_UI } from './libraryTheme';

type LibraryTopRatedShelfProps = {
  books: LibraryBook[];
  onBookPress: (book: LibraryBook) => void;
};

export function LibraryTopRatedShelf({ books, onBookPress }: LibraryTopRatedShelfProps) {
  if (!books.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.shelf}
      style={styles.shelfWrap}
    >
      {books.map((book) => (
        <ShelfBook key={book.id} book={book} onPress={() => onBookPress(book)} />
      ))}
    </ScrollView>
  );
}

function ShelfBook({ book, onPress }: { book: LibraryBook; onPress: () => void }) {
  const { t } = useTranslation('app');
  const variant = coverVariantForBook(book);
  const Icon = resolveTestSubjectIcon(book.subject, book.title);
  const pro = isProBook(book);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <BookCover title={book.title} variant={variant} watermarkIcon={Icon} size="lg" />
      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>
      {book.author ? (
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
      ) : null}
      <View style={styles.meta}>
        {book.rating != null ? (
          <View style={styles.rating}>
            <Star size={12} color={LIBRARY_UI.gold} fill={LIBRARY_UI.gold} strokeWidth={0} />
            <NumText style={styles.ratingText}>{book.rating.toFixed(1)}</NumText>
          </View>
        ) : null}
        <View style={[styles.badge, pro ? styles.badgePro : styles.badgeFree]}>
          <Text style={[styles.badgeText, pro && styles.badgeTextPro]}>
            {pro ? t('books.pro') : t('books.free')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shelfWrap: {
    marginHorizontal: -LIBRARY_UI.horizontalPad,
  },
  shelf: {
    gap: 14,
    paddingHorizontal: LIBRARY_UI.horizontalPad + 2,
    paddingBottom: 6,
  },
  item: {
    width: 114,
  },
  pressed: { opacity: 0.92 },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: LIBRARY_UI.ink,
    marginTop: 10,
    lineHeight: 15,
  },
  author: {
    fontSize: 10,
    fontWeight: '600',
    color: LIBRARY_UI.muted,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: LIBRARY_UI.goldDeep,
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeFree: {
    backgroundColor: LIBRARY_UI.sageSoft,
  },
  badgePro: {
    backgroundColor: LIBRARY_UI.goldLt,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: LIBRARY_UI.sageDeep,
  },
  badgeTextPro: {
    color: '#2a2110',
  },
});
