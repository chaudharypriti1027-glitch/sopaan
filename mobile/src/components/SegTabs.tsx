import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { denseTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

export type SegTabOption<T extends string> = {
  key: T;
  label: string;
};

type SegTabsProps<T extends string> = {
  options: SegTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
};

export function SegTabs<T extends string>({ options, value, onChange, style }: SegTabsProps<T>) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text {...denseTextProps} style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface.muted,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    tabSelected: {
      backgroundColor: theme.colors.surface.default,
      ...theme.shadows.card,
      shadowOpacity: 0.04,
      elevation: 1,
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.secondary,
    },
    labelSelected: {
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}
