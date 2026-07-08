import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { denseTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { PREMIUM } from './premium/premiumStyles';
import { platformShadow } from '../utils/platformShadow';

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
      backgroundColor: PREMIUM.accentSoft,
      borderRadius: 18,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: 'rgba(219,222,234,0.8)',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      paddingVertical: theme.spacing.sm,
      borderRadius: 14,
    },
    tabSelected: {
      backgroundColor: '#FFFFFF',
      ...platformShadow({
        color: PREMIUM.accent,
        offsetY: 2,
        opacity: 0.14,
        radius: 8,
        elevation: 2,
      }),
    },
    label: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PREMIUM.sectionLabel,
    },
    labelSelected: {
      color: PREMIUM.accent,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
    },
  });
}
