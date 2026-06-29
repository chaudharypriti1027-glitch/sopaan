import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type TimelineItemProps = {
  time: string;
  title: string;
  subtitle?: string;
  isLast?: boolean;
  completed?: boolean;
  style?: ViewStyle;
};

export function TimelineItem({
  time,
  title,
  subtitle,
  isLast = false,
  completed = false,
  style,
}: TimelineItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, completed, isLast), [theme, completed, isLast]);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.content}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  completed: boolean,
  isLast: boolean,
) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      minHeight: isLast ? undefined : 72,
    },
    rail: {
      width: 20,
      alignItems: 'center',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: completed ? theme.colors.semantic.success : theme.colors.brand.primary,
      borderWidth: 2,
      borderColor: completed ? theme.colors.semantic.successMuted : theme.colors.brand.primaryMuted,
    },
    line: {
      flex: 1,
      width: 2,
      backgroundColor: theme.colors.border.default,
      marginTop: theme.spacing.xs,
    },
    content: {
      flex: 1,
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    time: {
      ...theme.typography.presets.label,
      color: theme.colors.text.tertiary,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    subtitle: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}
