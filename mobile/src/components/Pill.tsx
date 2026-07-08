import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { PREMIUM } from './premium/premiumStyles';

export type PillVariant = 'primary' | 'gold' | 'teal' | 'coral' | 'muted';

type PillProps = {
  label: string;
  variant?: PillVariant;
  style?: ViewStyle;
};

const PILL_STYLES: Record<PillVariant, { bg: string; fg: string }> = {
  primary: { bg: PREMIUM.accentSoft, fg: PREMIUM.accent },
  gold: { bg: PREMIUM.goldSoft, fg: PREMIUM.goldDeep },
  teal: { bg: PREMIUM.sageSoft, fg: PREMIUM.sageDeep },
  coral: { bg: '#F5E2DC', fg: '#A8503E' },
  muted: { bg: '#F3F0E8', fg: PREMIUM.sectionLabel },
};

export function Pill({ label, variant = 'primary', style }: PillProps) {
  const { theme } = useTheme();
  const palette = PILL_STYLES[variant];
  const styles = useMemo(() => createStyles(theme, palette), [theme, palette]);

  return (
    <View style={[styles.pill, style]}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  palette: { bg: string; fg: string },
) {
  return StyleSheet.create({
    pill: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: 'rgba(236,232,221,0.7)',
    },
    label: {
      color: palette.fg,
      textTransform: 'uppercase',
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.35,
      fontSize: 10,
    },
  });
}
