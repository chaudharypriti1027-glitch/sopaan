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
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type GhostButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
  /** Outlined gold treatment for secondary CTAs on the navy canvas. */
  tone?: 'form' | 'canvas';
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
  tone = 'form',
}: GhostButtonProps) {
  const styles = useMemo(() => createStyles(tone), [tone]);
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
        <ActivityIndicator
          color={tone === 'canvas' ? AUTH_UI.goldLt : AUTH_UI.accent}
          size="small"
        />
      ) : (
        <Text {...scalableTextProps} style={styles.label}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles(tone: 'form' | 'canvas') {
  const isCanvas = tone === 'canvas';

  return StyleSheet.create({
    button: {
      minHeight: isCanvas ? 54 : 48,
      borderRadius: AUTH_UI.btnRadius,
      borderWidth: 1,
      borderColor: isCanvas ? AUTH_UI.borderHover : 'rgba(28,36,80,0.12)',
      backgroundColor: isCanvas ? 'rgba(240,212,136,0.05)' : AUTH_UI.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
      marginTop: isCanvas ? 0 : 6,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      backgroundColor: isCanvas ? 'rgba(240,212,136,0.1)' : AUTH_UI.card,
      borderColor: isCanvas ? 'rgba(240,212,136,0.5)' : AUTH_UI.borderHover,
      transform: [{ scale: 0.98 }],
    },
    label: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: isCanvas ? 16 : 14,
      fontWeight: '600',
      letterSpacing: 0.2,
      color: isCanvas ? AUTH_UI.onCanvas : AUTH_UI.accent,
    },
  });
}
