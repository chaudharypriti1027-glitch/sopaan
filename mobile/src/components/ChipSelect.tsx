import { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

type ChipSelectProps = {
  label: string;
  selected?: boolean;
  onPress?: PressableProps['onPress'];
  style?: ViewStyle;
  emoji?: string;
  testID?: string;
};

export function ChipSelect({
  label,
  selected = false,
  onPress,
  style,
  emoji,
  testID,
}: ChipSelectProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, selected), [theme, selected]);
  const resolvedTestId =
    testID ?? `chip-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={resolvedTestId}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed, style]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text {...scalableTextProps} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], selected: boolean) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: theme.radii.full,
      backgroundColor: selected ? theme.colors.brand.primaryMuted : theme.colors.surface.default,
      borderWidth: 1.5,
      borderColor: selected ? theme.colors.brand.primary : theme.colors.border.default,
    },
    pressed: {
      opacity: 0.92,
    },
    emoji: {
      fontSize: theme.typography.scale.fontSize.md,
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: selected ? theme.colors.brand.primary : theme.colors.text.primary,
      fontFamily: selected
        ? theme.typography.fonts.ui.semibold
        : theme.typography.fonts.ui.medium,
      flexShrink: 1,
    },
  });
}
