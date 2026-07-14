import { Bookmark, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  FeatureScreenLayout,
  Flashcard,
  PremiumFeatureCard,
  QueryStateView,
  SegTabs,
} from '../../components';
import { listSavedAffairIds } from '../../affairs/savedAffairs';
import { cacheAffair, getCachedAffair } from '../../affairs/offlineAffairCache';
import { currentAffairsApi } from '../../api';
import type { CurrentAffair } from '../../api/types';
import {
  listSavedFlashcards,
  removeFlashcardBookmark,
  type SavedFlashcard,
} from '../../flashcards/savedFlashcards';
import { useDeleteNote, useNetworkStatus, useSavedNotes } from '../../hooks';
import { useTheme } from '../../theme';

type NotesTab = 'ca' | 'ai' | 'flashcards';

export function NotesScreen() {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isOffline } = useNetworkStatus();
  const notesQuery = useSavedNotes();
  const deleteNoteMutation = useDeleteNote();

  const [tab, setTab] = useState<NotesTab>('ca');
  const [loading, setLoading] = useState(true);
  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [flashcards, setFlashcards] = useState<SavedFlashcard[]>([]);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const tabOptions = useMemo(
    () => [
      { key: 'ca' as const, label: t('notes.tabCa') },
      { key: 'ai' as const, label: t('notes.tabAi') },
      { key: 'flashcards' as const, label: t('notes.tabFlashcards') },
    ],
    [t],
  );

  const notes = notesQuery.data ?? [];

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [savedIds, cardItems] = await Promise.all([
        listSavedAffairIds(),
        listSavedFlashcards(),
      ]);

      setFlashcards(cardItems);

      if (savedIds.length === 0) {
        setAffairs([]);
      } else {
        const results = await Promise.allSettled(
          savedIds.map(async (id) => {
            if (isOffline) {
              const cached = await getCachedAffair(id);
              if (cached) {
                return cached;
              }
              throw new Error('offline-miss');
            }

            const affair = await currentAffairsApi.getCurrentAffair(id);
            await cacheAffair(affair);
            return affair;
          }),
        );
        setAffairs(
          results
            .filter((result): result is PromiseFulfilledResult<CurrentAffair> => result.status === 'fulfilled')
            .map((result) => result.value),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDeleteNote = (id: string) => {
    Alert.alert(t('notes.deleteTitle'), t('notes.deleteBody'), [
      { text: t('notes.cancel'), style: 'cancel' },
      {
        text: t('notes.delete'),
        style: 'destructive',
        onPress: () => {
          deleteNoteMutation.mutate(id);
        },
      },
    ]);
  };

  const handleDeleteFlashcard = (id: string) => {
    void removeFlashcardBookmark(id).then(refresh);
  };

  return (
    <FeatureScreenLayout title={t('notes.title')} subtitle={t('notes.subtitle')}>
      <SegTabs options={tabOptions} value={tab} onChange={setTab} />

      {loading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : tab === 'ca' ? (
        <View style={styles.list}>
          {affairs.length === 0 ? (
            <PremiumFeatureCard>
              <Text style={styles.empty}>{t('notes.emptyCa')}</Text>
            </PremiumFeatureCard>
          ) : (
            affairs.map((item) => (
              <PremiumFeatureCard key={item.id} style={styles.caCard}>
                <View style={styles.caHeader}>
                  <Bookmark size={16} color={theme.colors.brand.primary} />
                  <Text style={styles.caCategory}>{item.category ?? t('notes.news')}</Text>
                </View>
                <Text style={styles.caTitle}>{item.title}</Text>
                <Text style={styles.caSummary} numberOfLines={3}>
                  {item.summary}
                </Text>
              </PremiumFeatureCard>
            ))
          )}
        </View>
      ) : tab === 'ai' ? (
        <QueryStateView
          isLoading={notesQuery.isLoading}
          isError={notesQuery.isError}
          isFetching={notesQuery.isFetching}
          isOffline={isOffline}
          hasData={notes.length > 0}
          onRetry={() => void notesQuery.refetch()}
        >
          <View style={styles.list}>
            {notes.length === 0 ? (
              <PremiumFeatureCard>
                <Text style={styles.empty}>{t('notes.emptyAi')}</Text>
              </PremiumFeatureCard>
            ) : (
              notes.map((note) => (
                <PremiumFeatureCard key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Pressable onPress={() => handleDeleteNote(note.id)}>
                      <Trash2 size={16} color={theme.colors.text.tertiary} />
                    </Pressable>
                  </View>
                  <Text style={styles.noteBody} numberOfLines={6}>
                    {note.content}
                  </Text>
                  <Text style={styles.noteDate}>
                    {new Date(note.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </PremiumFeatureCard>
              ))
            )}
          </View>
        </QueryStateView>
      ) : (
        <View style={styles.list}>
          {flashcards.length === 0 ? (
            <PremiumFeatureCard>
              <Text style={styles.empty}>{t('notes.emptyFlashcards')}</Text>
            </PremiumFeatureCard>
          ) : (
            flashcards.map((card) => (
              <View key={card.id} style={styles.flashcardBlock}>
                {card.deckTitle ? (
                  <Text style={styles.deckLabel}>{card.deckTitle}</Text>
                ) : null}
                <Flashcard
                  front={card.front}
                  back={card.back}
                  flipped={flippedId === card.id}
                  onFlip={() => setFlippedId((id) => (id === card.id ? null : card.id))}
                />
                <Pressable onPress={() => handleDeleteFlashcard(card.id)} style={styles.removeBtn}>
                  <Text style={styles.removeLabel}>{t('notes.removeBookmark')}</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}
    </FeatureScreenLayout>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    list: { gap: theme.spacing.md },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    caCard: { gap: theme.spacing.sm, padding: theme.spacing.md },
    caHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    caCategory: { ...theme.typography.presets.eyebrow, color: theme.colors.brand.primary },
    caTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    caSummary: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    noteCard: { gap: theme.spacing.sm, padding: theme.spacing.md },
    noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    noteTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    noteBody: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    noteDate: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    flashcardBlock: { gap: theme.spacing.sm },
    deckLabel: { ...theme.typography.presets.caption, color: theme.colors.text.tertiary },
    removeBtn: { alignSelf: 'flex-start' },
    removeLabel: { ...theme.typography.presets.caption, color: theme.colors.semantic.error },
  });
}
