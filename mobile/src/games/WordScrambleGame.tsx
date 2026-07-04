import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { GAMES_UI } from './gamesTheme';
import { SCRAMBLE_WORDS, shuffle } from './content';

function scrambleWord(word: string) {
  return shuffle(word.split('')).join('');
}

type WordScrambleGameProps = {
  onComplete: (score: number) => void;
};

export function WordScrambleGame({ onComplete }: WordScrambleGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [rounds] = useState(() => shuffle(SCRAMBLE_WORDS).slice(0, 5));
  const [index, setIndex] = useState(0);
  const [scrambled] = useState(() => rounds.map((r) => scrambleWord(r.word)));
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = rounds[index];

  const submit = () => {
    const correct = answer.trim().toUpperCase() === current.word;
    const nextScore = score + (correct ? 20 : 0);
    setFeedback(correct ? 'Correct!' : `Answer: ${current.word}`);
    setScore(nextScore);

    setTimeout(() => {
      const next = index + 1;
      if (next >= rounds.length) {
        onComplete(nextScore);
        return;
      }
      setIndex(next);
      setAnswer('');
      setFeedback(null);
    }, 900);
  };

  return (
    <View style={styles.root}>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Round {index + 1}/{rounds.length}
        </Text>
        <Text style={styles.score}>Score {score}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.hint}>
          📚 {current.hint} — {current.word.length} letters
        </Text>
        <View style={styles.lettersRow}>
          {scrambled[index].split('').map((letter, i) => (
            <View key={`${letter}-${i}`} style={styles.letterTile}>
              <Text style={styles.letterText}>{letter}</Text>
            </View>
          ))}
        </View>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="characters"
          placeholder="Type the word"
          placeholderTextColor={GAMES_UI.muted}
          style={styles.input}
          onSubmitEditing={submit}
        />
        {feedback ? (
          <Text style={[styles.feedback, feedback.startsWith('Answer') && styles.feedbackWrong]}>
            {feedback}
          </Text>
        ) : null}
        <Button label="Check" onPress={submit} fullWidth />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: 12,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progress: {
      fontSize: 13,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    score: {
      fontSize: 13,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    box: {
      padding: 20,
      gap: 16,
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
    hint: {
      fontSize: 11,
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '700',
    },
    lettersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    letterTile: {
      width: 40,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(245,158,11,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    letterText: {
      fontSize: 20,
      fontWeight: '900',
      color: '#D97706',
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
