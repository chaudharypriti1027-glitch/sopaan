import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { STORY_ROUNDS } from './banks';
import { GAMES_UI } from './gamesTheme';
import { shuffle } from './content';

type StoryBuilderGameProps = {
  onComplete: (score: number) => void;
};

export function StoryBuilderGame({ onComplete }: StoryBuilderGameProps) {
  const styles = useMemo(() => createStyles(), []);
  const [rounds] = useState(() => shuffle(STORY_ROUNDS));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const current = rounds[index];
  const parts = current.template.split('___');
  const storyText = `${parts[0]}${picked ?? '___'}${parts[1] ?? ''}`;

  const pick = (option: string) => {
    if (picked) {
      return;
    }
    setPicked(option);
    const correct = option === current.answer;
    const nextScore = score + (correct ? 30 : 0);

    setTimeout(() => {
      const next = index + 1;
      if (next >= rounds.length) {
        onComplete(nextScore);
        return;
      }
      setScore(nextScore);
      setIndex(next);
      setPicked(null);
    }, 700);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.progress}>
        Sentence {index + 1}/{rounds.length} · Score {score}
      </Text>

      <View style={styles.storyBox}>
        <Text style={styles.storyLabel}>📖 Build the story</Text>
        <Text style={styles.storyText}>{storyText}</Text>
      </View>

      <View style={styles.options}>
        {current.options.map((option) => {
          const isPicked = picked === option;
          const isCorrect = option === current.answer;
          const stateStyle = isPicked
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
    progress: {
      fontSize: 13,
      fontWeight: '700',
      color: GAMES_UI.muted,
    },
    storyBox: {
      padding: 20,
      backgroundColor: GAMES_UI.surface,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: GAMES_UI.border,
      gap: 10,
    },
    storyLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: GAMES_UI.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    storyText: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '700',
      color: GAMES_UI.text,
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
      fontSize: 15,
      fontWeight: '700',
      color: GAMES_UI.text,
      textAlign: 'center',
    },
    pressed: { opacity: 0.92 },
  });
}
