import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';

type PracticeChipVariant = 'purple' | 'amber' | 'green' | 'white';

type PracticeChipProps = {
  label: string;
  variant?: PracticeChipVariant;
  /** Dark text + solid tints for chips sitting on light cards. */
  onLight?: boolean;
};

export function PracticeChip({ label, variant = 'white', onLight = false }: PracticeChipProps) {
  const styles = useMemo(() => createStyles(variant, onLight), [variant, onLight]);

  return (
    <View style={styles.chip}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(variant: PracticeChipVariant, onLight: boolean) {
  const palette = onLight
    ? {
        purple: {
          bg: PRACTICE_UI.statIndigoBg,
          border: 'rgba(28,36,80,0.16)',
          text: PRACTICE_UI.statIndigo,
        },
        amber: {
          bg: PRACTICE_UI.statAmberBg,
          border: 'rgba(166,127,46,0.3)',
          text: PRACTICE_UI.statAmber,
        },
        green: {
          bg: PRACTICE_UI.statGreenBg,
          border: 'rgba(76,114,100,0.3)',
          text: PRACTICE_UI.statGreen,
        },
        white: {
          bg: '#FFFFFF',
          border: 'rgba(28,36,80,0.14)',
          text: PRACTICE_UI.ink,
        },
      }[variant]
    : {
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
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: palette.border,
      maxWidth: '100%',
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.text,
      lineHeight: 16,
    },
  });
}
