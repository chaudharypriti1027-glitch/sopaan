import { useMemo, forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { scalableTextProps } from '../a11y/textProps';
import { useTheme } from '../theme';
import { PREMIUM } from './premium/premiumStyles';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, containerStyle, style, testID, accessibilityLabel, ...rest },
  ref,
) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, Boolean(error), focused),
    [theme, error, focused],
  );
  const resolvedTestId =
    testID ??
    (label
      ? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      : undefined);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text {...scalableTextProps} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        testID={resolvedTestId}
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={PREMIUM.sectionLabel}
        style={[styles.input, style]}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        {...scalableTextProps}
        {...rest}
      />
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
  hasError: boolean,
  focused: boolean,
) {
  const borderColor = hasError
    ? theme.colors.semantic.error
    : focused
      ? PREMIUM.gold
      : 'rgba(236,232,221,0.95)';

  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    label: {
      ...theme.typography.presets.label,
      color: PREMIUM.sectionLabel,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    input: {
      ...theme.typography.presets.body,
      color: PREMIUM.ink,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor,
      borderRadius: 16,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: theme.a11y.minTouchTarget,
    },
    error: {
      ...theme.typography.presets.caption,
      color: theme.colors.semantic.error,
    },
  });
}
