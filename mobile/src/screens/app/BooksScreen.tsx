import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Star } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, SectionTitle } from '../../components';
import { useBooks } from '../../hooks';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type BooksRoute = RouteProp<MainStackParamList, 'Books'>;

export function BooksScreen() {
  const route = useRoute<BooksRoute>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const booksQuery = useBooks({ limit: 50 });
  const books = (booksQuery.data?.items ?? []).filter(
    (book) => !route.params?.examId || book.examId === route.params.examId,
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Books & resources" subtitle="Recommended reads for your exam" />

      {booksQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : (
        <View style={styles.list}>
          {(books).map((book) => (
            <Card key={book.id} style={styles.card}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.meta}>
                {book.author}
                {book.subject ? ` · ${book.subject}` : ''}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.exam}>{book.examName ?? book.examCode}</Text>
                {book.rating != null ? (
                  <View style={styles.rating}>
                    <Star size={14} color={theme.colors.accent.gold} fill={theme.colors.accent.gold} />
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
          ))}
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    list: { gap: theme.spacing.md },
    card: { gap: theme.spacing.sm },
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
