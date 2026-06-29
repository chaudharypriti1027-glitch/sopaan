import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

type PlanTaskRowProps = {
  title: string;
  subtitle?: string;
  completed?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
};

export function PlanTaskRow({
  title,
  subtitle,
  completed = false,
  onToggle,
  style,
}: PlanTaskRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, completed), [theme, completed]);

  const a11yLabel = completed ? `${title}, completed` : `${title}, not completed`;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={a11yLabel}
      onPress={onToggle}
      style={[styles.row, style]}
    >
      <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
        {completed ? <Check size={14} color={theme.colors.brand.onPrimary} strokeWidth={3} /> : null}
      </View>
      <View style={styles.content}>
        <Text {...scalableTextProps} style={[styles.title, completed && styles.titleCompleted]}>
          {title}
        </Text>
        {subtitle ? (
          <Text {...scalableTextProps} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], completed: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: theme.a11y.minTouchTarget,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: theme.radii.sm,
      borderWidth: 1.5,
      borderColor: theme.colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      backgroundColor: theme.colors.surface.default,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    content: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    titleCompleted: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    subtitle: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}
