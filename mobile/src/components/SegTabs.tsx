import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { denseTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { HOME_UI } from './home/homeTheme';
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
            <Text
              {...denseTextProps}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              ellipsizeMode="clip"
              style={[styles.label, selected && styles.labelSelected]}
            >
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
      backgroundColor: HOME_UI.borderSoft,
      borderRadius: 999,
      padding: 3,
      gap: 1,
      borderWidth: 0,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingVertical: 7,
      paddingHorizontal: 2,
      borderRadius: 999,
    },
    tabSelected: {
      backgroundColor: '#FFFFFF',
      ...platformShadow({
        color: HOME_UI.shadow,
        offsetY: 3,
        opacity: 0.1,
        radius: 8,
        elevation: 2,
      }),
    },
    label: {
      width: '100%',
      textAlign: 'center',
      fontSize: 12,
      letterSpacing: -0.15,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: HOME_UI.muted,
    },
    labelSelected: {
      color: HOME_UI.ink,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
    },
  });
}
