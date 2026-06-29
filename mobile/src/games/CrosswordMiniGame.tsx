import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { GAMES_UI } from './gamesTheme';
import { CROSSWORD_CLUES, shuffle } from './content';

type CrosswordMiniGameProps = {
  onComplete: (score: number) => void;
};

export function CrosswordMiniGame({ onComplete }: CrosswordMiniGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [clues] = useState(() => shuffle(CROSSWORD_CLUES));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);

  const current = clues[index];

  const submit = () => {
    const correct = answer.trim().toUpperCase() === current.word;
    const nextScore = score + (correct ? 15 : 0);
    const next = index + 1;
    if (next >= clues.length) {
      onComplete(nextScore);
      return;
    }
    setScore(nextScore);
    setIndex(next);
    setAnswer('');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.progress}>
        Clue {index + 1}/{clues.length} · Score {score}
      </Text>
      <View style={styles.card}>
        <Text style={styles.qLabel}>🧩 CROSSWORD</Text>
        <Text style={styles.clue}>{current.hint}</Text>
        <Text style={styles.length}>{current.word.length} letters</Text>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="characters"
          placeholder="Your answer"
          placeholderTextColor={GAMES_UI.muted}
          style={styles.input}
          onSubmitEditing={submit}
        />
        <Button label="Submit" onPress={submit} fullWidth />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: 12,
    },
    progress: {
      fontSize: 13,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    card: {
      padding: 20,
      gap: 14,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      shadowColor: GAMES_UI.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 3,
    },
    qLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    clue: {
      fontSize: 16,
      fontWeight: '700',
      color: GAMES_UI.text,
      lineHeight: 22,
    },
    length: {
      fontSize: 12,
      color: GAMES_UI.muted,
      fontWeight: '600',
    },
    input: {
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      fontWeight: '600',
      color: GAMES_UI.text,
      backgroundColor: GAMES_UI.card2,
    },
  });
}
