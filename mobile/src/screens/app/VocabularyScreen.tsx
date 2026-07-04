import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Flashcard, QueryStateView, Screen, SectionTitle } from '../../components';
import { useNetworkStatus, useVocabularyRecent, useVocabularyToday } from '../../hooks';
import type { VocabularyWord } from '../../api/types';
import { useTheme } from '../../theme';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function VocabularyScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isOffline } = useNetworkStatus();
  const todayQuery = useVocabularyToday();
  const recentQuery = useVocabularyRecent(7);

  const [flipped, setFlipped] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizWords, setQuizWords] = useState<VocabularyWord[]>([]);
  const [options, setOptions] = useState<string[]>([]);

  const recent = (recentQuery.data ?? []).filter((w) => w.id !== todayQuery.data?.id);

  const startQuiz = () => {
    const pool = [todayQuery.data, ...(recentQuery.data ?? [])].filter(Boolean) as VocabularyWord[];
    if (pool.length < 3) return;

    const words = shuffle(pool).slice(0, Math.min(5, pool.length));
    setQuizWords(words);
    setQuizIndex(0);
    setQuizScore(0);
    setSelected(null);
    setQuizActive(true);
    buildOptions(words[0], pool);
  };

  const buildOptions = (current: VocabularyWord, pool: VocabularyWord[]) => {
    const distractors = shuffle(pool.filter((w) => w.id !== current.id))
      .slice(0, 3)
      .map((w) => w.meaning ?? w.word);
    setOptions(shuffle([current.meaning ?? current.word, ...distractors]));
  };

  const handleAnswer = (answer: string) => {
    const current = quizWords[quizIndex];
    setSelected(answer);
    const correct = answer === (current.meaning ?? current.word);
    const nextScore = correct ? quizScore + 1 : quizScore;
    setQuizScore(nextScore);

    setTimeout(() => {
      const nextIndex = quizIndex + 1;
      if (nextIndex >= quizWords.length) {
        setQuizActive(false);
        return;
      }
      setQuizIndex(nextIndex);
      setSelected(null);
      buildOptions(quizWords[nextIndex], [todayQuery.data, ...(recentQuery.data ?? [])].filter(Boolean) as VocabularyWord[]);
    }, 700);
  };

  const today = todayQuery.data;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title="Vocabulary" subtitle="Word of the day and quick quiz" />

      <QueryStateView
        isLoading={todayQuery.isLoading}
        isError={todayQuery.isError}
        isFetching={todayQuery.isFetching}
        isOffline={isOffline}
        hasData={Boolean(today)}
        onRetry={() => void todayQuery.refetch()}
      >
      {today ? (
        <Flashcard
          front={today.word}
          back={`${today.meaning ?? ''}${today.example ? `\n\n"${today.example}"` : ''}`}
          flipped={flipped}
          onFlip={() => setFlipped((v) => !v)}
        />
      ) : null}

      {quizActive && quizWords[quizIndex] ? (
        <Card style={styles.quizCard}>
          <Text style={styles.quizLabel}>
            Quiz {quizIndex + 1}/{quizWords.length}
          </Text>
          <Text style={styles.quizWord}>{quizWords[quizIndex].word}</Text>
          <Text style={styles.quizPrompt}>Pick the correct meaning</Text>
          <View style={styles.options}>
            {options.map((option) => {
              const isCorrect = option === (quizWords[quizIndex].meaning ?? quizWords[quizIndex].word);
              const isSelected = selected === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => !selected && handleAnswer(option)}
                  style={[
                    styles.option,
                    isSelected && (isCorrect ? styles.optionCorrect : styles.optionWrong),
                  ]}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : (
        <Button label="Start vocab quiz" onPress={startQuiz} />
      )}

      {!quizActive && quizScore > 0 && quizWords.length > 0 ? (
        <Text style={styles.score}>
          Last quiz: {quizScore}/{quizWords.length}
        </Text>
      ) : null}

      <SectionTitle title="Recent words" />
      <View style={styles.recentList}>
        {recent.map((word) => (
          <Card key={word.id} style={styles.recentCard}>
            <Text style={styles.recentWord}>{word.word}</Text>
            <Text style={styles.recentMeaning} numberOfLines={1}>{word.meaning}</Text>
          </Card>
        ))}
      </View>
      </QueryStateView>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    centered: { alignItems: 'center', justifyContent: 'center' },
    quizCard: { gap: theme.spacing.md },
    quizLabel: { ...theme.typography.presets.label, color: theme.colors.text.tertiary },
    quizWord: {
      ...theme.typography.presets.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    quizPrompt: { ...theme.typography.presets.caption, color: theme.colors.text.secondary, textAlign: 'center' },
    options: { gap: theme.spacing.sm },
    option: {
      padding: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.surface.muted,
    },
    optionCorrect: { borderColor: theme.colors.semantic.success, backgroundColor: theme.colors.semantic.successMuted },
    optionWrong: { borderColor: theme.colors.semantic.error, backgroundColor: theme.colors.semantic.errorMuted },
    optionText: { ...theme.typography.presets.body, color: theme.colors.text.primary },
    score: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.semantic.success,
      textAlign: 'center',
    },
    recentList: { gap: theme.spacing.sm },
    recentCard: { gap: theme.spacing.xs },
    recentWord: {
      ...theme.typography.presets.bodyMedium,
      fontFamily: theme.typography.fonts.ui.semibold,
      color: theme.colors.text.primary,
    },
    recentMeaning: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
  });
}
