import { ChevronRight, Star } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../Button';
import { ChipSelect } from '../ChipSelect';
import { TextField } from '../TextField';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { PracticeChip } from './PracticeChip';

type PracticeAiCardProps = {
  badgeLabel: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  countLabel: string;
  tapConfigure: string;
  expanded: boolean;
  onToggle: () => void;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  difficulties: readonly string[];
  difficultyLabels: Record<string, string>;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  counts: readonly number[];
  selectedCount: number;
  onCountChange: (value: number) => void;
  subjectLabel: string;
  topicLabel: string;
  difficultyLabel: string;
  questionsLabel: string;
  generateLabel: string;
  generating: boolean;
  onGenerate: () => void;
};

export function PracticeAiCard({
  badgeLabel,
  title,
  subject,
  topic,
  difficulty,
  countLabel,
  tapConfigure,
  expanded,
  onToggle,
  onSubjectChange,
  onTopicChange,
  difficulties,
  difficultyLabels,
  selectedDifficulty,
  onDifficultyChange,
  counts,
  selectedCount,
  onCountChange,
  subjectLabel,
  topicLabel,
  difficultyLabel,
  questionsLabel,
  generateLabel,
  generating,
  onGenerate,
}: PracticeAiCardProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => !expanded && onToggle()}
      style={({ pressed }) => [styles.card, pressed && !expanded && styles.pressed]}
      testID="practice-ai-generate-card"
    >
      <View style={styles.badge}>
        <Star size={13} color={PRACTICE_UI.goldBadge} strokeWidth={2.5} fill={PRACTICE_UI.goldBadge} />
        <Text style={styles.badgeText}>{badgeLabel}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      {!expanded ? (
        <>
          <View style={styles.chips}>
            <PracticeChip label={subject} variant="purple" />
            <PracticeChip label={topic} variant="amber" />
            <PracticeChip label={difficulty} variant="green" />
            <PracticeChip label={countLabel} variant="white" />
          </View>
          <Pressable onPress={onToggle} style={styles.configureRow} hitSlop={8}>
            <Text style={styles.configure}>{tapConfigure}</Text>
            <ChevronRight size={14} color={PRACTICE_UI.gold} strokeWidth={2.5} />
          </Pressable>
        </>
      ) : (
        <View style={styles.form}>
          <TextField label={subjectLabel} value={subject} onChangeText={onSubjectChange} />
          <TextField label={topicLabel} value={topic} onChangeText={onTopicChange} />
          <Text style={styles.fieldLabel}>{difficultyLabel}</Text>
          <View style={styles.chipRow}>
            {difficulties.map((level) => (
              <ChipSelect
                key={level}
                label={difficultyLabels[level] ?? level}
                selected={selectedDifficulty === level}
                onPress={() => onDifficultyChange(level)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>{questionsLabel}</Text>
          <View style={styles.chipRow}>
            {counts.map((n) => (
              <ChipSelect
                key={n}
                label={String(n)}
                selected={selectedCount === n}
                onPress={() => onCountChange(n)}
              />
            ))}
          </View>
          <Button
            label={generateLabel}
            testID="practice-generate-start"
            fullWidth
            variant="gold"
            loading={generating}
            onPress={onGenerate}
          />
        </View>
      )}
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: 'rgba(255,255,255,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 20,
      padding: 16,
    },
    pressed: {
      opacity: 0.94,
    },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(245,158,11,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.4)',
      marginBottom: 12,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: PRACTICE_UI.gold,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 10,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginBottom: 12,
    },
    configureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    configure: {
      fontSize: 12,
      fontWeight: '600',
      color: PRACTICE_UI.gold,
    },
    form: {
      gap: 12,
      marginTop: 4,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: PRACTICE_UI.chipWhiteText,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
}
