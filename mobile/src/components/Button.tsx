import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'gold' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  testID?: string;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  fullWidth = false,
  testID,
  accessibilityHint,
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, variant, size), [theme, variant, size]);
  const isDisabled = disabled || loading;
  const resolvedTestId =
    testID ?? `button-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={resolvedTestId}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? theme.colors.brand.primary : theme.colors.brand.onPrimary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text {...scalableTextProps} style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  variant: ButtonVariant,
  size: ButtonSize,
) {
  const sizeMap = {
    sm: { py: theme.spacing.sm, px: theme.spacing.md, fontSize: theme.typography.scale.fontSize.sm },
    md: { py: theme.spacing.md, px: theme.spacing.xl, fontSize: theme.typography.scale.fontSize.base },
    lg: { py: theme.spacing.lg, px: theme.spacing['2xl'], fontSize: theme.typography.scale.fontSize.md },
  }[size];

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
      labelColor: theme.colors.brand.onPrimary,
      borderWidth: 0,
    },
    gold: {
      backgroundColor: theme.colors.accent.gold,
      borderColor: theme.colors.accent.gold,
      labelColor: theme.colors.text.primary,
      borderWidth: 0,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border.default,
      labelColor: theme.colors.brand.primary,
      borderWidth: 1,
    },
  }[variant];

  return StyleSheet.create({
    button: {
      borderRadius: theme.radii.pill,
      paddingVertical: sizeMap.py,
      paddingHorizontal: sizeMap.px,
      minHeight: theme.a11y.minTouchTarget,
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.9,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    label: {
      fontFamily: theme.typography.fonts.ui.semibold,
      fontSize: sizeMap.fontSize,
      color: variantStyles.labelColor,
    },
  });
}
