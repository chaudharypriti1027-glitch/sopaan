import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Star } from 'lucide-react-native';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, QueryStateView, Screen, SectionTitle } from '../../components';
import { resolveTestSubjectIcon } from '../../components/home/homeUtils';
import type { Book } from '../../api/books';
import { useBooks, useNetworkStatus } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { toneColors, toneForText } from '../../utils/iconTone';
import { useTheme } from '../../theme';

type BooksRoute = RouteProp<MainStackParamList, 'Books'>;

type BookCardProps = {
  book: Book;
  styles: ReturnType<typeof createStyles>;
  goldColor: string;
};

function BookCard({ book, styles, goldColor }: BookCardProps) {
  const Icon = resolveTestSubjectIcon(book.subject, book.title);
  const tone = toneColors(toneForText(book.subject ?? book.title));

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.iconTile, { backgroundColor: tone.bg }]}>
          <Icon size={20} color={tone.fg} strokeWidth={2} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.meta}>
            {book.author}
            {book.subject ? ` · ${book.subject}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.exam}>{book.examName ?? book.examCode}</Text>
        {book.rating != null ? (
          <View style={styles.rating}>
            <Star size={14} color={goldColor} fill={goldColor} />
            <Text style={styles.ratingText}>{book.rating}</Text>
          </View>
        ) : null}
      </View>
      {book.link ? (
        <Pressable onPress={() => Linking.openURL(book.link!)}>
          <Text style={styles.link}>View resource →</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function BooksScreen() {
  const route = useRoute<BooksRoute>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const booksQuery = useBooks({ limit: 50 });
  const books = (booksQuery.data?.items ?? []).filter(
    (book) => !route.params?.examId || book.examId === route.params.examId,
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Books & resources" subtitle="Recommended reads for your exam" />

      <QueryStateView
        isLoading={booksQuery.isLoading}
        isError={booksQuery.isError}
        isFetching={booksQuery.isFetching}
        isOffline={isOffline}
        hasData={books.length > 0}
        onRetry={() => void booksQuery.refetch()}
      >
        <View style={styles.list}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              styles={styles}
              goldColor={theme.colors.accent.gold}
            />
          ))}
        </View>
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    list: { gap: theme.spacing.md },
    card: { gap: theme.spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    info: { flex: 1, gap: theme.spacing.xs },
    title: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    meta: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    exam: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    rating: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    ratingText: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    link: { ...theme.typography.presets.bodyMedium, color: theme.colors.brand.primary },
  });
}
