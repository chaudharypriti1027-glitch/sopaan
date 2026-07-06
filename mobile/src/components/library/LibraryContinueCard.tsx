import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { LibraryBook } from '../../api/books';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
import { BookCover } from './BookCover';
import { coverVariantForBook, pagesLeftForBook, progressPercentForBook } from './libraryUtils';
import { LIBRARY_UI, libraryCard } from './libraryTheme';

type LibraryContinueCardProps = {
  book: LibraryBook;
  onPress: () => void;
};

export function LibraryContinueCard({ book, onPress }: LibraryContinueCardProps) {
  const { t } = useTranslation('app');
  const progress = progressPercentForBook(book);
  const pagesLeft = pagesLeftForBook(book);
  const chapter = book.subject ?? t('books.defaultChapter');
  const variant = coverVariantForBook(book);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <BookCover title={book.title} variant={variant} size="sm" showBrand={false} />
      <View style={styles.content}>
        <Text style={styles.tag}>{t('books.continueChapter', { chapter })}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta}>
          {t('books.continueMeta', { progress, pages: pagesLeft })}
        </Text>
        <ProgressBar pct={progress} />
      </View>
      <View style={styles.playBtn}>
        <Play size={19} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
      </View>
    </Pressable>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withDelay(400, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(pct * value.value, 0)}%`,
  }));

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, fillStyle]}>
        <LinearGradient
          colors={[LIBRARY_UI.goldLt, LIBRARY_UI.gold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.barGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    ...libraryCard({ borderRadius: LIBRARY_UI.cardRadius }),
  },
  pressed: { opacity: 0.92 },
  content: {
    flex: 1,
    minWidth: 0,
  },
  tag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: LIBRARY_UI.goldDeep,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: LIBRARY_UI.ink,
    marginTop: 3,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    color: LIBRARY_UI.muted,
    marginTop: 3,
  },
  barTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: LIBRARY_UI.hair,
    overflow: 'hidden',
    marginTop: 9,
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
    height: '100%',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: LIBRARY_UI.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...platformShadow({ color: LIBRARY_UI.navy, offsetY: 10, opacity: 0.35, radius: 14, elevation: 3 }),
  },
});
