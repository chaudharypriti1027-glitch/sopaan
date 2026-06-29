import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { AUTH_UI } from './authTheme';

type GhostButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
};

export function GhostButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  testID,
  accessibilityHint,
}: GhostButtonProps) {
  const styles = useMemo(() => createStyles(), []);
  const isDisabled = disabled || loading;

  const resolvedTestId =
    testID ?? `ghost-button-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

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
        <ActivityIndicator color={AUTH_UI.accent} size="small" />
      ) : (
        <Text {...scalableTextProps} style={styles.label}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    button: {
      minHeight: 48,
      borderRadius: AUTH_UI.btnRadius,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      backgroundColor: AUTH_UI.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      backgroundColor: '#EEF2FF',
      borderColor: '#C7D2FE',
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: AUTH_UI.accent,
    },
  });
}
