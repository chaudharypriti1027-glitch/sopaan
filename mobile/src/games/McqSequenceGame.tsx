import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { GAMES_UI } from './gamesTheme';
import type { GameAnswerRecord } from './completion';
import { gameComplete } from './completion';
import type { McqQuestion } from './types';
import { shuffle } from './content';
import { percentScore } from './score';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

type McqSequenceGameProps = {
  questions: McqQuestion[];
  label?: string;
  onComplete: (result: ReturnType<typeof gameComplete>) => void;
};

export function McqSequenceGame({ questions, label, onComplete }: McqSequenceGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [pool] = useState(() => shuffle(questions));
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerLog, setAnswerLog] = useState<GameAnswerRecord[]>([]);

  const current = pool[index];

  const recordAnswer = (question: McqQuestion, option: string, correct: boolean): GameAnswerRecord => ({
    questionId: question.id,
    prompt: question.prompt,
    topic: question.label,
    selected: option,
    correct,
    correctAnswer: question.answer,
    explanation: question.explanation,
  });

  const pick = (option: string) => {
    if (selected) {
      return;
    }
    setSelected(option);
    const correct = option === current.answer;
    const entry = recordAnswer(current, option, correct);
    const nextCorrect = correctCount + (correct ? 1 : 0);

    setTimeout(() => {
      const next = index + 1;
      const nextLog = [...answerLog, entry];
      if (next >= pool.length) {
        onComplete(gameComplete(percentScore(nextCorrect, pool.length), nextLog));
        return;
      }
      setAnswerLog(nextLog);
      setCorrectCount(nextCorrect);
      setIndex(next);
      setSelected(null);
    }, 500);
  };

  const qLabel = current.label ?? label;

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Text style={styles.progress}>
          Question {index + 1}/{pool.length}
        </Text>
        <Text style={styles.score}>
          Score {percentScore(correctCount, pool.length)}%
        </Text>
      </View>

      <View style={styles.card}>
        {qLabel ? <Text style={styles.qLabel}>{qLabel}</Text> : null}
        <Text style={styles.prompt}>{current.prompt}</Text>
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
    score: {
      fontSize: 13,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    card: {
      padding: 20,
      gap: 16,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
    },
    qLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    prompt: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '800',
      color: GAMES_UI.text,
    },
    options: { gap: 10 },
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
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderColor: 'rgba(16,185,129,0.35)',
    },
    optionWrong: {
      backgroundColor: 'rgba(239,68,68,0.08)',
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
    pressed: { opacity: 0.92 },
    optionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: GAMES_UI.text,
    },
  });
}
