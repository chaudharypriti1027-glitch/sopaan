import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { GAMES_UI } from './gamesTheme';
import { GK_QUESTIONS, shuffle } from './content';
import { gameComplete, type GameAnswerRecord } from './completion';
import { percentScore } from './score';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

type McqGameProps = {
  questions: typeof GK_QUESTIONS;
  durationSec?: number;
  label?: string;
  onComplete: (result: ReturnType<typeof gameComplete>) => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function McqTimedGame({ questions, durationSec = 60, label, onComplete }: McqGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [pool] = useState(() => shuffle(questions));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [selected, setSelected] = useState<string | null>(null);
  const finished = useRef(false);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const answersRef = useRef<GameAnswerRecord[]>([]);

  const finish = useCallback(() => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    onComplete(
      gameComplete(
        percentScore(correctRef.current, Math.max(answeredRef.current, 1)),
        answersRef.current,
      ),
    );
  }, [onComplete]);

  useEffect(() => {
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, finish]);

  const current = pool[index % pool.length];

  const pick = (option: string) => {
    if (selected || finished.current) {
      return;
    }
    setSelected(option);
    const correct = option === current.answer;
    answeredRef.current += 1;
    answersRef.current.push({
      questionId: current.id,
      prompt: current.prompt,
      topic: current.label,
      selected: option,
      correct,
      correctAnswer: current.answer,
      explanation: current.explanation,
    });
    if (correct) {
      correctRef.current += 1;
      setScore(correctRef.current);
    }

    setTimeout(() => {
      setSelected(null);
      const next = index + 1;
      if (timeLeft <= 1 && next >= pool.length) {
        finish();
        return;
      }
      setIndex(next);
    }, 500);
  };

  const isRapid = label?.includes('RAPID');

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={[styles.timerChip, timeLeft <= 10 && styles.timerUrgent]}>
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerUrgentText]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={[styles.card, isRapid && styles.cardRapid]}>
        {label ? <Text style={[styles.qLabel, isRapid && styles.qLabelRapid]}>{label}</Text> : null}
        <Text style={[styles.prompt, isRapid && styles.promptRapid]}>{current.prompt}</Text>
        <View style={styles.options}>
          {current.options.map((option, optionIndex) => {
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
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>{OPTION_LETTERS[optionIndex]}</Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      gap: 14,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scoreChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: GAMES_UI.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    scoreLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: GAMES_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scoreValue: {
      fontSize: 16,
      fontWeight: '900',
      color: GAMES_UI.text,
    },
    timerChip: {
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(239,68,68,0.25)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    timerUrgent: {
      backgroundColor: 'rgba(239,68,68,0.15)',
      borderColor: GAMES_UI.red,
    },
    timerText: {
      fontSize: 14,
      fontWeight: '900',
      color: GAMES_UI.red,
    },
    timerUrgentText: {
      color: '#B91C1C',
    },
    card: {
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
    cardRapid: {
      backgroundColor: 'rgba(239,68,68,0.04)',
      borderColor: 'rgba(239,68,68,0.2)',
    },
    qLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    qLabelRapid: {
      color: GAMES_UI.red,
    },
    prompt: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    promptRapid: {
      fontSize: 20,
    },
    options: {
      gap: 10,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: GAMES_UI.card2,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
    },
    optionCorrect: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(16,185,129,0.35)',
    },
    optionWrong: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(239,68,68,0.35)',
    },
    optionLetter: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: GAMES_UI.surface,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionLetterText: {
      fontSize: 13,
      fontWeight: '900',
      color: GAMES_UI.accent,
    },
    pressed: {
      opacity: 0.92,
    },
    optionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: GAMES_UI.text,
    },
  });
}
