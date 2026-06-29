import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { LOGIC_PUZZLES } from './banks';
import { GAMES_UI } from './gamesTheme';
import { shuffle } from './content';

type LogicPuzzleGameProps = {
  onComplete: (score: number) => void;
};

export function LogicPuzzleGame({ onComplete }: LogicPuzzleGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [puzzles] = useState(() => shuffle(LOGIC_PUZZLES));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const current = puzzles[index];

  const select = (cell: string) => {
    if (confirmed) {
      return;
    }
    setPicked(cell);
  };

  const confirm = () => {
    if (!picked || confirmed) {
      return;
    }
    setConfirmed(true);
    const correct = picked === current.answer;
    const nextScore = score + (correct ? 25 : 0);

    setTimeout(() => {
      const next = index + 1;
      if (next >= puzzles.length) {
        onComplete(nextScore);
        return;
      }
      setScore(nextScore);
      setIndex(next);
      setPicked(null);
      setConfirmed(false);
    }, 700);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.progress}>
        Puzzle {index + 1}/{puzzles.length} · Score {score}
      </Text>

      <View style={styles.card}>
        <Text style={styles.qLabel}>🧩 Pattern Recognition</Text>
        <Text style={styles.prompt}>{current.prompt}</Text>
      </View>

      <View style={styles.board}>
        {current.cells.map((cell, cellIndex) => {
          const isPicked = picked === cell;
          const isAnswer = confirmed && cell === current.answer;
          const isWrong = confirmed && isPicked && cell !== current.answer;
          return (
            <Pressable
              key={`${cell}-${cellIndex}`}
              accessibilityRole="button"
              onPress={() => select(cell)}
              style={[
                styles.cell,
                isPicked && styles.cellPicked,
                isAnswer && styles.cellCorrect,
                isWrong && styles.cellWrong,
              ]}
            >
              <Text style={styles.cellText}>{cell}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.hintBox}>
        <Text style={styles.hint}>🧠 {current.hint}</Text>
      </View>

      {picked ? (
        <Text style={styles.selection}>
          Selected: <Text style={styles.selectionBold}>{picked}</Text>
        </Text>
      ) : null}

      <Button label="Confirm Answer ✓" onPress={confirm} fullWidth disabled={!picked} />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: 14 },
    progress: {
      fontSize: 13,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    card: {
      padding: 18,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      gap: 8,
    },
    qLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.accent,
      textTransform: 'uppercase',
    },
    prompt: {
      fontSize: 15,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    cell: {
      width: '22%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: GAMES_UI.card2,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellPicked: {
      borderColor: GAMES_UI.accent,
      backgroundColor: 'rgba(107,78,255,0.1)',
    },
    cellCorrect: {
      borderColor: GAMES_UI.green,
      backgroundColor: 'rgba(16,185,129,0.12)',
    },
    cellWrong: {
      borderColor: GAMES_UI.red,
      backgroundColor: 'rgba(239,68,68,0.1)',
    },
    cellText: {
      fontSize: 22,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    hintBox: {
      backgroundColor: 'rgba(107,78,255,0.06)',
      borderRadius: 14,
      padding: 12,
    },
    hint: {
      fontSize: 13,
      color: GAMES_UI.text2,
      fontWeight: '600',
    },
    selection: {
      textAlign: 'center',
      fontSize: 14,
      color: GAMES_UI.muted,
    },
    selectionBold: {
      fontWeight: '900',
      color: GAMES_UI.accent,
    },
  });
}
