import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

export type QuickActionTone = 'primary' | 'gold' | 'teal' | 'coral';

type QuickAction = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
  tone?: QuickActionTone;
};

type QuickActionsProps = {
  actions: QuickAction[];
  style?: ViewStyle;
};

function toneStyles(theme: ReturnType<typeof useTheme>['theme'], tone: QuickActionTone) {
  const map = {
    primary: {
      bg: theme.colors.brand.primaryMuted,
    },
    gold: {
      bg: theme.colors.accent.goldMuted,
    },
    teal: {
      bg: theme.colors.accent.tealMuted,
    },
    coral: {
      bg: theme.colors.accent.coralMuted,
    },
  } as const;

  return map[tone];
}

export function QuickActions({ actions, style }: QuickActionsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.grid, style]}>
      {actions.map((action) => {
        const tone = action.tone ?? 'primary';
        const iconStyle = toneStyles(theme, tone);

        return (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: iconStyle.bg }]}>{action.icon}</View>
            <Text {...scalableTextProps} style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 88,
      paddingHorizontal: theme.spacing.xs,
    },
    pressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fonts.ui.semibold,
      textAlign: 'center',
      lineHeight: 14,
    },
  });
}
