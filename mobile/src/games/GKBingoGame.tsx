import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { BINGO_QUESTIONS } from './banks';
import { GAMES_UI } from './gamesTheme';
import { shuffle } from './content';

const BINGO_LABELS = ['B', 'I', 'N', 'G', 'O'] as const;

type GKBingoGameProps = {
  onComplete: (score: number) => void;
};

export function GKBingoGame({ onComplete }: GKBingoGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [questions] = useState(() => shuffle(BINGO_QUESTIONS));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [marked, setMarked] = useState<boolean[]>([false, false, false, false, false]);
  const [selected, setSelected] = useState<string | null>(null);

  const current = questions[index];

  const pick = (option: string) => {
    if (selected) {
      return;
    }
    setSelected(option);
    const correct = option === current.answer;
    const nextScore = score + (correct ? 20 : 0);
    const nextMarked = [...marked];
    nextMarked[index] = correct;
    setMarked(nextMarked);

    setTimeout(() => {
      const next = index + 1;
      if (next >= questions.length) {
        const bingoBonus = nextMarked.filter(Boolean).length >= 3 ? 20 : 0;
        onComplete(nextScore + bingoBonus);
        return;
      }
      setScore(nextScore);
      setIndex(next);
      setSelected(null);
    }, 600);
  };

  return (
    <View style={styles.root}>
      <View style={styles.questionBox}>
        <Text style={styles.qLabel}>Current Question</Text>
        <Text style={styles.prompt}>{current.prompt}</Text>
      </View>

      <View style={styles.bingoHeader}>
        {BINGO_LABELS.map((letter) => (
          <Text key={letter} style={styles.bingoLetter}>
            {letter}
          </Text>
        ))}
      </View>

      <View style={styles.bingoRow}>
        {marked.map((isMarked, i) => (
          <View key={BINGO_LABELS[i]} style={[styles.bingoCell, isMarked && styles.bingoMarked]}>
            <Text style={[styles.bingoCellText, isMarked && styles.bingoMarkedText]}>
              {isMarked ? '✓' : i === index ? '?' : '·'}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>Tap the correct answer to mark your bingo cell!</Text>

      <View style={styles.options}>
        {current.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === current.answer;
          const stateStyle = isSelected
            ? isCorrect
              ? styles.optionCorrect
              : styles.optionWrong
            : null;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => pick(option)}
              style={({ pressed }) => [styles.option, stateStyle, pressed && styles.pressed]}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: 14 },
    questionBox: {
      marginHorizontal: 0,
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(16,185,129,0.2)',
      borderRadius: 16,
      padding: 14,
    },
    qLabel: {
      fontSize: 11,
      color: GAMES_UI.green,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    prompt: {
      fontSize: 15,
      fontWeight: '800',
      color: GAMES_UI.text,
      marginTop: 6,
    },
    bingoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
    },
    bingoLetter: {
      fontSize: 13,
      fontWeight: '900',
      color: GAMES_UI.accent,
      width: 56,
      textAlign: 'center',
    },
    bingoRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 8,
    },
    bingoCell: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bingoMarked: {
      backgroundColor: GAMES_UI.green,
      borderColor: GAMES_UI.green,
    },
    bingoCellText: {
      fontSize: 18,
      fontWeight: '900',
      color: GAMES_UI.muted,
    },
    bingoMarkedText: {
      color: '#FFFFFF',
    },
    hint: {
      fontSize: 12,
      color: GAMES_UI.muted,
      fontWeight: '700',
      textAlign: 'center',
    },
    options: { gap: 10 },
    option: {
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: GAMES_UI.card2,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
    },
    optionCorrect: {
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderColor: 'rgba(16,185,129,0.35)',
    },
    optionWrong: {
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderColor: 'rgba(239,68,68,0.35)',
    },
    optionText: {
      fontSize: 14,
      fontWeight: '700',
      color: GAMES_UI.text,
      textAlign: 'center',
    },
    pressed: { opacity: 0.92 },
  });
}
