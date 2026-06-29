import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type GoalCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  selected?: boolean;
  onPress?: PressableProps['onPress'];
  style?: ViewStyle;
  testID?: string;
};

export function GoalCard({
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
  style,
  testID,
}: GoalCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, selected), [theme, selected]);
  const resolvedTestId =
    testID ?? `goal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      testID={resolvedTestId}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], selected: boolean) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: selected ? theme.colors.brand.primaryMuted : theme.colors.surface.default,
      borderRadius: theme.radii.card,
      borderWidth: 1.5,
      borderColor: selected ? theme.colors.brand.primary : theme.colors.border.default,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      ...theme.shadows.card,
      shadowOpacity: selected ? 0.08 : theme.shadows.card.shadowOpacity,
    },
    pressed: {
      opacity: 0.94,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.lg,
      backgroundColor: selected ? theme.colors.surface.default : theme.colors.accent.goldMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
    subtitle: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}
