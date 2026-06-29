import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Check, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { useTheme } from '../../theme';

export type FieldVariant = 'text' | 'phone' | 'email' | 'password';

export type FieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  variant?: FieldVariant;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  success?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
};

const PHONE_DIGITS = 10;

function normalizePhoneInput(raw: string) {
  return raw.replace(/\D/g, '').slice(0, PHONE_DIGITS);
}

function LeadingIcon({ variant, color }: { variant: FieldVariant; color: string }) {
  const size = 18;

  switch (variant) {
    case 'phone':
      return <Phone size={size} color={color} />;
    case 'email':
      return <Mail size={size} color={color} />;
    case 'password':
      return <Lock size={size} color={color} />;
    default:
      return <User size={size} color={color} />;
  }
}

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    variant = 'text',
    label,
    value,
    onChangeText,
    error,
    success = false,
    containerStyle,
    testID,
    editable = true,
    accessibilityLabel,
    keyboardType,
    autoCapitalize,
    secureTextEntry,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const focusProgress = useSharedValue(value.length > 0 ? 1 : 0);

  const hasError = Boolean(error);
  const showSuccess = success && !hasError && value.length > 0;
  const isActive = focused || value.length > 0;
  const isPassword = variant === 'password';
  const isPhone = variant === 'phone';

  const styles = useMemo(
    () => createStyles(theme, { focused, hasError, showSuccess, isActive }),
    [theme, focused, hasError, showSuccess, isActive],
  );

  const resolvedTestId =
    testID ??
    `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  const handleFocus = useCallback(() => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: 160 });
  }, [focusProgress]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (value.length === 0) {
      focusProgress.value = withTiming(0, { duration: 160 });
    }
  }, [focusProgress, value.length]);

  useEffect(() => {
    focusProgress.value = withTiming(value.length > 0 || focused ? 1 : 0, { duration: 160 });
  }, [focused, focusProgress, value.length]);

  const handleChange = useCallback(
    (text: string) => {
      if (isPhone) {
        onChangeText(normalizePhoneInput(text));
        return;
      }

      onChangeText(text);
    },
    [isPhone, onChangeText],
  );

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(focusProgress.value, [0, 1], [0, -10]) },
      { scale: interpolate(focusProgress.value, [0, 1], [1, 0.86]) },
    ],
  }));

  const resolvedKeyboardType =
    keyboardType ??
    (variant === 'phone' ? 'phone-pad' : variant === 'email' ? 'email-address' : 'default');

  const resolvedAutoCapitalize =
    autoCapitalize ?? (variant === 'email' ? 'none' : variant === 'password' ? 'none' : 'sentences');

  const resolvedSecureEntry = isPassword ? !passwordVisible : secureTextEntry;

  const labelLeft =
    theme.spacing.md +
    22 +
    theme.spacing.sm +
    (isPhone ? theme.spacing.sm + 36 : 0);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.shell}>
        <Animated.Text
          {...scalableTextProps}
          style={[styles.floatingLabel, { left: labelLeft }, labelStyle]}
        >
          {label}
        </Animated.Text>

        <View style={styles.row}>
          <View style={styles.leadingIcon}>
            <LeadingIcon
              variant={variant}
              color={
                hasError
                  ? theme.colors.accent.coral
                  : showSuccess
                    ? theme.colors.accent.teal
                    : focused
                      ? theme.colors.brand.primary
                      : theme.colors.text.tertiary
              }
            />
          </View>

          {isPhone ? (
            <View style={styles.phoneChip}>
              <Text {...scalableTextProps} style={styles.phoneChipText}>
                +91
              </Text>
            </View>
          ) : null}

          <TextInput
            ref={ref}
            testID={resolvedTestId}
            accessibilityLabel={accessibilityLabel ?? label}
            value={value}
            onChangeText={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={editable}
            placeholder=""
            placeholderTextColor={theme.colors.text.tertiary}
            keyboardType={resolvedKeyboardType}
            autoCapitalize={resolvedAutoCapitalize}
            autoCorrect={variant === 'email' || isPassword ? false : rest.autoCorrect}
            secureTextEntry={resolvedSecureEntry}
            style={styles.input}
            {...scalableTextProps}
            {...rest}
          />

          {isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              hitSlop={8}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={styles.trailingAction}
            >
              {passwordVisible ? (
                <EyeOff size={18} color={theme.colors.text.secondary} />
              ) : (
                <Eye size={18} color={theme.colors.text.secondary} />
              )}
            </Pressable>
          ) : null}

          {showSuccess ? (
            <View style={styles.trailingAction}>
              <Check size={18} color={theme.colors.accent.teal} />
            </View>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text {...scalableTextProps} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  state: { focused: boolean; hasError: boolean; showSuccess: boolean; isActive: boolean },
) {
  const borderColor = state.hasError
    ? theme.colors.accent.coral
    : state.showSuccess
      ? theme.colors.accent.teal
      : state.focused
        ? theme.colors.brand.primary
        : theme.colors.border.default;

  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    shell: {
      borderRadius: theme.radii.button,
      borderWidth: state.focused ? 2 : 1,
      borderColor,
      backgroundColor: theme.colors.surface.default,
      minHeight: theme.a11y.minTouchTarget + 8,
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      ...theme.shadows.card,
      shadowOpacity: state.focused ? 0.1 : 0.05,
    },
    floatingLabel: {
      position: 'absolute',
      top: state.isActive ? 10 : 18,
      fontFamily: theme.typography.fonts.ui.medium,
      fontSize: state.isActive
        ? theme.typography.scale.fontSize.xs
        : theme.typography.scale.fontSize.sm,
      color: state.hasError
        ? theme.colors.accent.coral
        : state.focused
          ? theme.colors.brand.primary
          : theme.colors.text.secondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    leadingIcon: {
      width: 22,
      alignItems: 'center',
    },
    phoneChip: {
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.brand.primaryMuted,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    phoneChipText: {
      fontFamily: theme.typography.fonts.stat.semibold,
      fontSize: theme.typography.scale.fontSize.sm,
      color: theme.colors.brand.primary,
    },
    input: {
      flex: 1,
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.xs,
      minHeight: 24,
    },
    trailingAction: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: {
      ...theme.typography.presets.caption,
      color: theme.colors.accent.coral,
      marginLeft: theme.spacing.xs,
    },
  });
}
