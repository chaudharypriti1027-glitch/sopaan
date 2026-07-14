import { Bookmark } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FeatureScreenLayout,
  Flashcard,
  PremiumFeatureCard,
  QueryStateView,
} from '../../components';
import { SR_RATING_BUTTONS } from '../../content/flashcardsContent';
import {
  useDeckDueCounts,
  useFlashcardDecks,
  useFlashcardsDue,
  useFlashcardsDueCount,
  useNetworkStatus,
  useReviewFlashcard,
  type SrRating,
} from '../../hooks';
import type { DueFlashcard, FlashcardDeck } from '../../api/flashcards';
import { saveFlashcardBookmark } from '../../flashcards/savedFlashcards';
import { useTheme } from '../../theme';

export function FlashcardsScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();
  const decksQuery = useFlashcardDecks();
  const dueQuery = useFlashcardsDue();
  const dueCountQuery = useFlashcardsDueCount();
  const deckDueCountsQuery = useDeckDueCounts();
  const reviewFlashcard = useReviewFlashcard();

  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [sessionCards, setSessionCards] = useState<DueFlashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const decks = decksQuery.data?.items ?? [];
  const deckDueCounts = deckDueCountsQuery.data?.counts ?? {};
  const totalDue = dueCountQuery.data?.count ?? dueQuery.data?.count ?? 0;

  const openDeck = (deck: FlashcardDeck) => {
    const dueItems =
      dueQuery.data?.items.filter((item) => item.deckId === deck.id) ??
      deck.cards.map((card) => ({
        ...card,
        deckId: deck.id,
        deckTitle: deck.title,
        dueDate: new Date().toISOString(),
        review: null,
      }));

    const queue = dueItems.length
      ? dueItems
      : deck.cards.map((card) => ({
          ...card,
          deckId: deck.id,
          deckTitle: deck.title,
          dueDate: new Date().toISOString(),
          review: null,
        }));

    setSelectedDeck(deck);
    setSessionCards(queue);
    setCardIndex(0);
    setFlipped(false);
  };

  const currentCard = sessionCards[cardIndex];

  const handleRate = (rating: SrRating) => {
    if (!currentCard || !selectedDeck) return;

    reviewFlashcard.mutate(
      { cardId: currentCard.id, rating },
      {
        onSuccess: () => {
          const nextIndex = cardIndex + 1;
          if (nextIndex >= sessionCards.length) {
            setSelectedDeck(null);
            setSessionCards([]);
          } else {
            setCardIndex(nextIndex);
            setFlipped(false);
          }
        },
      },
    );
  };

  if (selectedDeck && currentCard) {
    return (
      <FeatureScreenLayout
        title={selectedDeck.title}
        subtitle={t('flashcards.sessionSubtitle', {
          current: cardIndex + 1,
          total: sessionCards.length,
        })}
      >
        <Flashcard
          front={currentCard.front}
          back={currentCard.back}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />
        <Pressable
          style={styles.bookmarkRow}
          onPress={() =>
            void saveFlashcardBookmark({
              id: currentCard.id,
              front: currentCard.front,
              back: currentCard.back,
              deckTitle: selectedDeck.title,
            })
          }
        >
          <Bookmark size={16} color={theme.colors.brand.primary} />
          <Text style={styles.bookmarkLabel}>{t('flashcards.bookmarkCard')}</Text>
        </Pressable>
        {flipped ? (
          <View style={styles.srRow}>
            {SR_RATING_BUTTONS.map(({ rating, labelKey, color }) => (
              <Pressable
                key={rating}
                onPress={() => handleRate(rating)}
                disabled={reviewFlashcard.isPending}
                style={[styles.srBtn, { borderColor: color }]}
              >
                <Text style={[styles.srLabel, { color }]}>{t(labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.hint}>{t('flashcards.flipHint')}</Text>
        )}
        <Button
          label={t('flashcards.backToDecks')}
          variant="ghost"
          onPress={() => setSelectedDeck(null)}
        />
      </FeatureScreenLayout>
    );
  }

  return (
    <FeatureScreenLayout
      title={t('flashcards.title')}
      subtitle={t('flashcards.subtitle', { count: totalDue })}
    >
      <QueryStateView
        isLoading={decksQuery.isLoading}
        isError={decksQuery.isError}
        isFetching={decksQuery.isFetching}
        isOffline={isOffline}
        hasData={decks.length > 0}
        onRetry={() => void decksQuery.refetch()}
      >
        <View style={styles.list}>
          {decks.map((deck) => {
            const due = deckDueCounts[deck.id] ?? deck.cardCount;
            return (
              <Pressable key={deck.id} onPress={() => openDeck(deck)}>
                <PremiumFeatureCard style={styles.deckCard}>
                  <Text style={styles.deckTitle}>{deck.title}</Text>
                  <Text style={styles.deckMeta}>
                    {t('flashcards.deckMeta', { count: deck.cardCount, due })}
                  </Text>
                </PremiumFeatureCard>
              </Pressable>
            );
          })}
          {decks.length === 0 ? (
            <PremiumFeatureCard>
              <Text style={styles.empty}>{t('flashcards.empty')}</Text>
            </PremiumFeatureCard>
          ) : null}
        </View>
      </QueryStateView>
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    list: { gap: theme.spacing.md },
    deckCard: { gap: theme.spacing.xs, padding: theme.spacing.md },
    deckTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    deckMeta: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
    srRow: { flexDirection: 'row', gap: theme.spacing.sm },
    srBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 1.5,
      alignItems: 'center',
    },
    srLabel: {
      ...theme.typography.presets.label,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    hint: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary, textAlign: 'center' },
    bookmarkRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, alignSelf: 'center' },
    bookmarkLabel: { ...theme.typography.presets.caption, color: theme.colors.brand.primary },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
  });
}
