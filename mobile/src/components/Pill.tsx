import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { getAccentColors, type AccentVariant } from './utils/variants';

export type PillVariant = AccentVariant | 'muted';

type PillProps = {
  label: string;
  variant?: PillVariant;
  style?: ViewStyle;
};

function resolveVariant(variant: PillVariant): AccentVariant {
  return variant === 'muted' ? 'soft' : variant;
}

export function Pill({ label, variant = 'primary', style }: PillProps) {
  const { theme } = useTheme();
  const resolved = resolveVariant(variant);
  const styles = useMemo(() => createStyles(theme, resolved), [theme, resolved]);

  return (
    <View style={[styles.pill, style]}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], variant: AccentVariant) {
  const accent = getAccentColors(theme, variant);

  return StyleSheet.create({
    pill: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      backgroundColor: accent.muted,
    },
    label: {
      color: accent.on,
      textTransform: 'uppercase',
    },
  });
}
