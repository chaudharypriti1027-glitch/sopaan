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
import { Card, Flashcard, QueryStateView, Screen, SectionTitle, SegTabs } from '../../components';
import { listSavedAffairIds } from '../../affairs/savedAffairs';
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

const TAB_OPTIONS = [
  { key: 'ca' as const, label: 'Saved CA' },
  { key: 'ai' as const, label: 'AI answers' },
  { key: 'flashcards' as const, label: 'Flashcards' },
];

export function NotesScreen() {
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
      } else if (!isOffline) {
        const results = await Promise.allSettled(
          savedIds.map((id) => currentAffairsApi.getCurrentAffair(id)),
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
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle
        title="Notes & bookmarks"
        subtitle="Saved current affairs, AI answers, and flashcards"
      />

      <SegTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

      {loading ? (
        <ActivityIndicator color={theme.colors.brand.primary} />
      ) : tab === 'ca' ? (
        <View style={styles.list}>
          {affairs.length === 0 ? (
            <Card>
              <Text style={styles.empty}>
                Bookmark articles from Current Affairs to see them here.
              </Text>
            </Card>
          ) : (
            affairs.map((item) => (
              <Card key={item.id} style={styles.caCard}>
                <View style={styles.caHeader}>
                  <Bookmark size={16} color={theme.colors.brand.primary} />
                  <Text style={styles.caCategory}>{item.category ?? 'News'}</Text>
                </View>
                <Text style={styles.caTitle}>{item.title}</Text>
                <Text style={styles.caSummary} numberOfLines={3}>
                  {item.summary}
                </Text>
              </Card>
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
              <Card>
                <Text style={styles.empty}>
                  Save AI answers from Ask AI using &quot;Save to notes&quot;.
                </Text>
              </Card>
            ) : (
              notes.map((note) => (
                <Card key={note.id} style={styles.noteCard}>
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
                </Card>
              ))
            )}
          </View>
        </QueryStateView>
      ) : (
        <View style={styles.list}>
          {flashcards.length === 0 ? (
            <Card>
              <Text style={styles.empty}>
                Bookmark flashcards during review to collect them here.
              </Text>
            </Card>
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
                  onFlip={() =>
                    setFlippedId((id) => (id === card.id ? null : card.id))
                  }
                />
                <Pressable
                  onPress={() => handleDeleteFlashcard(card.id)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeLabel}>Remove bookmark</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    list: { gap: theme.spacing.md },
    empty: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    caCard: { gap: theme.spacing.sm },
    caHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    caCategory: { ...theme.typography.presets.eyebrow, color: theme.colors.brand.primary },
    caTitle: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    caSummary: { ...theme.typography.presets.body, color: theme.colors.text.secondary },
    noteCard: { gap: theme.spacing.sm },
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
