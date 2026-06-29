import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';

type PracticeChipVariant = 'purple' | 'amber' | 'green' | 'white';

type PracticeChipProps = {
  label: string;
  variant?: PracticeChipVariant;
};

export function PracticeChip({ label, variant = 'white' }: PracticeChipProps) {
  const styles = useMemo(() => createStyles(variant), [variant]);

  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(variant: PracticeChipVariant) {
  const palette = {
    purple: {
      bg: PRACTICE_UI.chipPurpleBg,
      border: PRACTICE_UI.chipPurpleBorder,
      text: PRACTICE_UI.chipPurpleText,
    },
    amber: {
      bg: PRACTICE_UI.chipAmberBg,
      border: PRACTICE_UI.chipAmberBorder,
      text: PRACTICE_UI.chipAmberText,
    },
    green: {
      bg: PRACTICE_UI.chipGreenBg,
      border: PRACTICE_UI.chipGreenBorder,
      text: PRACTICE_UI.chipGreenText,
    },
    white: {
      bg: PRACTICE_UI.chipWhiteBg,
      border: PRACTICE_UI.chipWhiteBorder,
      text: PRACTICE_UI.chipWhiteText,
    },
  }[variant];

  return StyleSheet.create({
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.text,
    },
  });
}
