import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { themeFonts } from '../../theme';
import { AUTH_UI } from './authTheme';

const DEFAULT_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  testID?: string;
  /** Dark glass cells with gold accents on the navy canvas. */
  dark?: boolean;
};

function sanitizeDigits(raw: string, length: number) {
  return raw.replace(/\D/g, '').slice(0, length);
}

function CaretPulse({ active, color }: { active: boolean; color: string }) {
  const opacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (!active) {
      opacity.value = 0;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [active, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 2,
          height: 22,
          borderRadius: 1,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/**
 * Six-box OTP entry backed by a single TextInput.
 * One real input avoids Android/iOS bugs where per-cell inputs block number typing.
 */
export function OtpInput({
  value,
  onChange,
  length = DEFAULT_LENGTH,
  error = false,
  success = false,
  disabled = false,
  autoFocus = false,
  testID = 'otp-input',
  dark = false,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const code = useMemo(() => sanitizeDigits(value, length), [value, length]);
  const digits = useMemo(() => code.split(''), [code]);
  const activeIndex = Math.min(code.length, length - 1);
  const styles = useMemo(() => createStyles(error, success, dark), [error, success, dark]);

  const focusInput = useCallback(() => {
    if (!disabled && !success) {
      inputRef.current?.focus();
    }
  }, [disabled, success]);

  useEffect(() => {
    if (autoFocus) {
      const id = setTimeout(focusInput, 80);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [autoFocus, focusInput]);

  return (
    <Pressable
      accessibilityRole="none"
      accessibilityLabel="One-time password"
      onPress={focusInput}
      style={styles.row}
      testID={testID}
    >
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index] ?? '';
        const filled = success || digit.length > 0;
        const isActive = !disabled && !success && index === activeIndex && code.length < length;

        return (
          <View
            key={`otp-${index}`}
            style={[
              styles.cell,
              filled && styles.cellFilled,
              isActive && styles.cellActive,
              error && styles.cellError,
            ]}
            pointerEvents="none"
          >
            {digit ? (
              <Text style={styles.digit}>{digit}</Text>
            ) : isActive ? (
              <CaretPulse active color={dark ? AUTH_UI.focus : AUTH_UI.accent} />
            ) : null}
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => onChange(sanitizeDigits(text, length))}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        editable={!disabled && !success}
        caretHidden
        autoFocus={autoFocus}
        underlineColorAndroid="transparent"
        importantForAutofill="yes"
        style={styles.hiddenInput}
        testID={`${testID}-field`}
      />
    </Pressable>
  );
}

function createStyles(error: boolean, success: boolean, dark: boolean) {
  const filledBorder = success
    ? '#10B981'
    : dark
      ? 'rgba(240,212,136,0.4)'
      : AUTH_UI.accent;
  const filledBg = success
    ? dark
      ? 'rgba(16,185,129,0.12)'
      : '#ECFDF5'
    : dark
      ? 'rgba(240,212,136,0.08)'
      : 'rgba(35,42,77,0.06)';

  return StyleSheet.create({
    row: {
      position: 'relative',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: dark ? 10 : 8,
    },
    cell: {
      flex: 1,
      maxWidth: 52,
      aspectRatio: 0.82,
      borderRadius: dark ? 15 : AUTH_UI.inputRadius,
      borderWidth: dark ? 1 : 1.5,
      borderColor: error
        ? dark
          ? 'rgba(224,122,95,0.75)'
          : '#F87171'
        : dark
          ? 'rgba(255,255,255,0.12)'
          : AUTH_UI.border,
      backgroundColor: dark ? 'rgba(255,255,255,0.03)' : AUTH_UI.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellFilled: {
      borderColor: filledBorder,
      backgroundColor: filledBg,
    },
    cellActive: {
      borderWidth: 1.5,
      borderColor: dark ? 'rgba(233,200,104,0.9)' : AUTH_UI.focus,
      backgroundColor: dark ? 'rgba(255,255,255,0.04)' : undefined,
      shadowColor: dark ? AUTH_UI.gold : AUTH_UI.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: dark ? 0.2 : 0.12,
      shadowRadius: dark ? 6 : 3,
    },
    cellError: {
      borderColor: dark ? 'rgba(224,122,95,0.75)' : '#F87171',
    },
    digit: {
      fontFamily: themeFonts.stat.bold,
      fontSize: dark ? 22 : 24,
      fontWeight: '700',
      color: dark ? AUTH_UI.onCanvas : AUTH_UI.ink,
      textAlign: 'center',
    },
    /** Full-row transparent input — receives all number taps/keystrokes. */
    hiddenInput: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.015,
      color: '#000000',
      backgroundColor: 'transparent',
      borderWidth: 0,
      fontSize: 16,
      zIndex: 5,
    },
  });
}
