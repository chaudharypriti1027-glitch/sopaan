import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../theme';

type DateChipProps = {
  label: string;
  selected?: boolean;
  onPress?: PressableProps['onPress'];
  style?: ViewStyle;
};

export function DateChip({ label, selected = false, onPress, style }: DateChipProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, selected), [theme, selected]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed, style]}
    >
      <Calendar size={14} color={selected ? theme.colors.brand.onPrimary : theme.colors.text.secondary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], selected: boolean) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.full,
      backgroundColor: selected ? theme.colors.brand.primary : theme.colors.surface.default,
      borderWidth: 1,
      borderColor: selected ? theme.colors.brand.primary : theme.colors.border.default,
    },
    pressed: {
      opacity: 0.9,
    },
    label: {
      ...theme.typography.presets.label,
      color: selected ? theme.colors.brand.onPrimary : theme.colors.text.primary,
    },
  });
}
