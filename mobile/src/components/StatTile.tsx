import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { PREMIUM_ICON_TONES, type PremiumIconTone } from './premium/premiumIconTokens';

type StatTileProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  /** Colors the icon tile to match Home's multi-color icon system (defaults to the classic navy tint). */
  tone?: PremiumIconTone;
  trend?: string;
  style?: ViewStyle;
};

export function StatTile({ label, value, icon, tone, trend, style }: StatTileProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const palette = tone ? (PREMIUM_ICON_TONES[tone] ?? PREMIUM_ICON_TONES.lavender) : null;

  return (
    <View style={[styles.tile, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.icon, palette ? { backgroundColor: palette.bg } : null]}>{icon}</View>
        ) : null}
        {trend ? <Text style={styles.trend}>{trend}</Text> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: 120,
      backgroundColor: theme.colors.surface.default,
      borderRadius: theme.radii.card,
      padding: theme.spacing.lg,
      ...theme.shadows.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.brand.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trend: {
      ...theme.typography.presets.label,
      color: theme.colors.semantic.success,
    },
    value: {
      ...theme.typography.presets.statLarge,
      fontSize: theme.typography.scale.fontSize['2xl'],
      color: theme.colors.text.primary,
    },
    label: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
  });
}
