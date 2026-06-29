import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { SPELLING_WORDS } from './banks';
import { GAMES_UI } from './gamesTheme';
import { shuffle } from './content';

type SpellingBeeGameProps = {
  onComplete: (score: number) => void;
};

export function SpellingBeeGame({ onComplete }: SpellingBeeGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [rounds] = useState(() => shuffle(SPELLING_WORDS).slice(0, 5));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = rounds[index];

  const submit = () => {
    const correct = answer.trim().toUpperCase() === current.word;
    const nextScore = score + (correct ? 20 : 0);
    setFeedback(correct ? 'Correct! 🐝' : `Answer: ${current.word}`);

    setTimeout(() => {
      const next = index + 1;
      if (next >= rounds.length) {
        onComplete(nextScore);
        return;
      }
      setScore(nextScore);
      setIndex(next);
      setAnswer('');
      setFeedback(null);
    }, 900);
  };

  return (
    <View style={styles.root}>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>Words: {index + 1}/{rounds.length}</Text>
        <Text style={styles.stat}>Points: {score}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.hint}>🐝 Spelling Bee — {current.word.length} letters</Text>
        <Text style={styles.definition}>{current.hint}</Text>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="characters"
          placeholder="Spell the word"
          placeholderTextColor={GAMES_UI.muted}
          style={styles.input}
          onSubmitEditing={submit}
        />
        {feedback ? (
          <Text style={[styles.feedback, feedback.startsWith('Answer') && styles.feedbackWrong]}>
            {feedback}
          </Text>
        ) : null}
        <Button label="Enter ✓" onPress={submit} fullWidth />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: 12 },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stat: {
      fontSize: 13,
      fontWeight: '800',
      color: GAMES_UI.muted,
    },
    box: {
      padding: 20,
      gap: 14,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
    },
    hint: {
      fontSize: 11,
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '700',
    },
    definition: {
      fontSize: 16,
      fontWeight: '700',
      color: GAMES_UI.text,
      lineHeight: 22,
    },
    input: {
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 2,
      color: GAMES_UI.text,
      backgroundColor: GAMES_UI.card2,
      textAlign: 'center',
    },
    feedback: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      color: GAMES_UI.green,
    },
    feedbackWrong: {
      color: GAMES_UI.red,
    },
  });
}
