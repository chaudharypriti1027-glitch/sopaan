import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme';

export type MilestoneStatus = 'completed' | 'current' | 'upcoming';

type MilestoneNodeProps = {
  title: string;
  subtitle?: string;
  status?: MilestoneStatus;
  isLast?: boolean;
  style?: ViewStyle;
};

export function MilestoneNode({
  title,
  subtitle,
  status = 'upcoming',
  isLast = false,
  style,
}: MilestoneNodeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, status, isLast), [theme, status, isLast]);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.rail}>
        <View style={styles.node}>
          {status === 'completed' ? (
            <Check size={14} color={theme.colors.brand.onPrimary} strokeWidth={3} />
          ) : (
            <View style={styles.innerDot} />
          )}
        </View>
        {!isLast ? <View style={styles.connector} /> : null}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  status: MilestoneStatus,
  isLast: boolean,
) {
  const nodeColors = {
    completed: {
      bg: theme.colors.semantic.success,
      border: theme.colors.semantic.success,
      inner: theme.colors.semantic.success,
    },
    current: {
      bg: theme.colors.brand.primary,
      border: theme.colors.brand.primaryMuted,
      inner: theme.colors.brand.onPrimary,
    },
    upcoming: {
      bg: theme.colors.surface.default,
      border: theme.colors.border.default,
      inner: theme.colors.border.default,
    },
  }[status];

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    rail: {
      alignItems: 'center',
      width: 28,
    },
    node: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: nodeColors.bg,
      borderWidth: 2,
      borderColor: nodeColors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: nodeColors.inner,
    },
    connector: {
      width: 2,
      flex: 1,
      minHeight: 40,
      backgroundColor: theme.colors.border.default,
      marginVertical: theme.spacing.xs,
    },
    content: {
      flex: 1,
      paddingBottom: isLast ? 0 : theme.spacing.xl,
      gap: theme.spacing.xs,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      color: status === 'upcoming' ? theme.colors.text.secondary : theme.colors.text.primary,
      fontFamily:
        status === 'current'
          ? theme.typography.fonts.ui.semibold
          : theme.typography.fonts.ui.medium,
    },
    subtitle: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.tertiary,
    },
  });
}
