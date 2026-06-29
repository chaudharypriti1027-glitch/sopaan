import { useMemo, forwardRef } from 'react';
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
  const styles = useMemo(() => createStyles(theme, Boolean(error)), [theme, error]);
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
        placeholderTextColor={theme.colors.text.tertiary}
        style={[styles.input, style]}
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

function createStyles(theme: ReturnType<typeof useTheme>['theme'], hasError: boolean) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    label: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
    },
    input: {
      ...theme.typography.presets.body,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface.default,
      borderWidth: 1,
      borderColor: hasError ? theme.colors.semantic.error : theme.colors.border.default,
      borderRadius: theme.radii.lg,
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
