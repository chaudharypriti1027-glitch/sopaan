import { LinearGradient } from 'expo-linear-gradient';
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
import { PREMIUM } from './premium/premiumStyles';

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

const GRADIENTS = {
  primary: ['#3A4578', '#232A4D', '#1A1F3B'] as const,
  gold: ['#F0D48A', '#C29A4E', '#A67C33'] as const,
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

  const labelContent = loading ? (
    <ActivityIndicator
      color={variant === 'ghost' ? PREMIUM.accent : '#FFFFFF'}
      size="small"
    />
  ) : (
    <View style={styles.content}>
      {icon}
      <Text {...scalableTextProps} style={styles.label}>
        {label}
      </Text>
    </View>
  );

  if (variant === 'ghost') {
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
        {labelContent}
      </Pressable>
    );
  }

  const gradient = variant === 'gold' ? GRADIENTS.gold : GRADIENTS.primary;

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
        styles.shell,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.button}
      >
        {labelContent}
      </LinearGradient>
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

  const labelColor =
    variant === 'ghost' ? PREMIUM.accent : variant === 'gold' ? PREMIUM.ink : '#FFFFFF';

  return StyleSheet.create({
    shell: {
      borderRadius: theme.radii.pill,
      overflow: 'hidden',
    },
    button: {
      borderRadius: theme.radii.pill,
      paddingVertical: sizeMap.py,
      paddingHorizontal: sizeMap.px,
      minHeight: theme.a11y.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: variant === 'ghost' ? 1 : 0,
      borderColor: theme.colors.border.default,
      backgroundColor: variant === 'ghost' ? 'transparent' : undefined,
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
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      fontSize: sizeMap.fontSize,
      color: labelColor,
    },
  });
}
