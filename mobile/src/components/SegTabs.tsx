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
      backgroundColor: theme.colors.brand.primaryMuted,
      borderRadius: theme.radii.pill,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.pill,
    },
    tabSelected: {
      backgroundColor: theme.colors.brand.primary,
      shadowColor: theme.colors.brand.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 3,
    },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.tertiary,
    },
    labelSelected: {
      color: theme.colors.brand.onPrimary,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}
