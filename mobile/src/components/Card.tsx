import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { premiumCard } from './premium/premiumStyles';
import { useTheme } from '../theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: PressableProps['onPress'];
  padded?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Card({
  children,
  style,
  onPress,
  padded = true,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, padded), [theme, padded]);

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], padded: boolean) {
  return StyleSheet.create({
    card: {
      padding: padded ? theme.spacing.lgPlus : theme.spacing.none,
      ...premiumCard(theme),
    },
    pressed: {
      opacity: 0.96,
    },
  });
}
