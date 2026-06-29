import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../components';
import { Text } from '../components/Text';
import { MATH_PROBLEMS, solveMath } from './banks';
import { GAMES_UI } from './gamesTheme';
import { shuffle } from './content';

type MathBlitzGameProps = {
  rounds?: number;
  durationSec?: number;
  onComplete: (score: number) => void;
};

export function MathBlitzGame({ rounds = 10, durationSec = 120, onComplete }: MathBlitzGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [problems] = useState(() => shuffle(MATH_PROBLEMS).slice(0, rounds));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const finished = useRef(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const finish = useCallback(
    (finalScore: number) => {
      if (finished.current) {
        return;
      }
      finished.current = true;
      onComplete(finalScore);
    },
    [onComplete],
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      finish(scoreRef.current);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, finish]);

  const current = problems[index % problems.length];

  const submit = () => {
    if (finished.current || !answer.trim()) {
      return;
    }
    const expected = solveMath(current);
    const correct = Number(answer) === expected;
    const nextScore = score + (correct ? 10 : 0);
    scoreRef.current = nextScore;
    setScore(nextScore);
    setAnswer('');

    const next = index + 1;
    if (next >= problems.length || timeLeft <= 1) {
      finish(nextScore);
      return;
    }
    setIndex(next);
  };

  const appendDigit = (digit: string) => {
    if (finished.current) {
      return;
    }
    setAnswer((prev) => (prev + digit).slice(0, 6));
  };

  const backspace = () => setAnswer((prev) => prev.slice(0, -1));

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Text style={styles.progress}>
          Problem {Math.min(index + 1, problems.length)}/{problems.length}
        </Text>
        <View style={styles.timerChip}>
          <Text style={styles.timerText}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      <View style={styles.box}>
        <Text style={styles.hint}>Solve for __:</Text>
        <Text style={styles.equation}>
          {current.a} {current.op} {current.b} = <Text style={styles.blank}>__</Text>
        </Text>
        <Text style={styles.answerDisplay}>{answer || '?'}</Text>
      </View>

      <View style={styles.numpad}>
        {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            onPress={() => appendDigit(key)}
            style={({ pressed }) => [styles.numBtn, pressed && styles.pressed]}
          >
            <Text style={styles.numText}>{key}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const next = index + 1;
            if (next >= problems.length) {
              finish(scoreRef.current);
            } else {
              setIndex(next);
              setAnswer('');
            }
          }}
          style={({ pressed }) => [styles.numBtn, styles.skipBtn, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => appendDigit('0')}
          style={({ pressed }) => [styles.numBtn, pressed && styles.pressed]}
        >
          <Text style={styles.numText}>0</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={backspace}
          style={({ pressed }) => [styles.numBtn, styles.delBtn, pressed && styles.pressed]}
        >
          <Text style={styles.numText}>⌫</Text>
        </Pressable>
      </View>

      <Button label="Submit Answer" onPress={submit} fullWidth />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { gap: 14 },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progress: {
      fontSize: 13,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    timerChip: {
      backgroundColor: 'rgba(249,115,22,0.1)',
      borderWidth: 1.5,
      borderColor: 'rgba(249,115,22,0.3)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    timerText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#F97316',
    },
    box: {
      padding: 24,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      gap: 12,
    },
    hint: {
      fontSize: 12,
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '700',
    },
    equation: {
      fontSize: 32,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    blank: {
      color: GAMES_UI.accent,
    },
    answerDisplay: {
      fontSize: 28,
      fontWeight: '900',
      color: GAMES_UI.gold,
      marginTop: 8,
    },
    numpad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    numBtn: {
      width: '30%',
      aspectRatio: 1.6,
      borderRadius: 16,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipBtn: {
      backgroundColor: GAMES_UI.card2,
    },
    delBtn: {
      backgroundColor: 'rgba(239,68,68,0.08)',
    },
    numText: {
      fontSize: 22,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    skipText: {
      fontSize: 13,
      fontWeight: '800',
      color: GAMES_UI.muted,
    },
    pressed: { opacity: 0.9 },
  });
}
