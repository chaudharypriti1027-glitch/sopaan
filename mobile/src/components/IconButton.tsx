import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { hitSlopForSize } from '../a11y/hitSlop';
import { useTheme } from '../theme';

type IconButtonVariant = 'default' | 'primary' | 'ghost';

type IconButtonProps = {
  icon: ReactNode;
  onPress?: PressableProps['onPress'];
  variant?: IconButtonVariant;
  size?: number;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
};

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size,
  accessibilityLabel,
  accessibilityHint,
  style,
  disabled = false,
  testID,
}: IconButtonProps) {
  const { theme } = useTheme();
  const resolvedSize = size ?? theme.a11y.minTouchTarget;
  const styles = useMemo(
    () => createStyles(theme, variant, resolvedSize),
    [theme, variant, resolvedSize],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlopForSize(resolvedSize, resolvedSize)}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  variant: IconButtonVariant,
  size: number,
) {
  const variantStyles = {
    default: {
      backgroundColor: theme.colors.surface.muted,
      borderColor: theme.colors.border.subtle,
      borderWidth: 0,
    },
    primary: {
      backgroundColor: theme.colors.brand.primaryMuted,
      borderColor: theme.colors.brand.primary,
      borderWidth: 0,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border.default,
      borderWidth: 1,
    },
  }[variant];

  return StyleSheet.create({
    button: {
      width: size,
      height: size,
      minWidth: theme.a11y.minTouchTarget,
      minHeight: theme.a11y.minTouchTarget,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      ...variantStyles,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.85,
    },
  });
}
