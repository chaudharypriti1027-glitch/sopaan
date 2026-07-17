import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scalableTextProps } from '../../a11y/textProps';
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

/** Six-box OTP entry — Space Grotesk, auto-advance, paste, caret pulse, accent fill when complete. */
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
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = useMemo(() => sanitizeDigits(value, length).split(''), [value, length]);
  const activeIndex = Math.min(digits.length, length - 1);

  const styles = useMemo(() => createStyles(error, success, dark), [error, success, dark]);

  const focusCell = useCallback((index: number) => {
    refs.current[index]?.focus();
  }, []);

  useEffect(() => {
    if (autoFocus) {
      focusCell(0);
    }
  }, [autoFocus, focusCell]);

  const applyDigits = useCallback(
    (nextRaw: string, startIndex = 0) => {
      const next = sanitizeDigits(nextRaw, length);
      onChange(next);

      const focusTarget = Math.min(next.length, length - 1);
      if (next.length >= length) {
        refs.current[length - 1]?.blur();
        return;
      }

      focusCell(Math.max(startIndex, focusTarget));
    },
    [focusCell, length, onChange],
  );

  const handleChange = useCallback(
    (text: string, index: number) => {
      if (text.length > 1) {
        applyDigits(text, index);
        return;
      }

      const nextDigits = [...digits];
      while (nextDigits.length < length) {
        nextDigits.push('');
      }

      nextDigits[index] = text.replace(/\D/g, '').slice(-1);
      const joined = nextDigits.join('').slice(0, length);
      onChange(joined);

      if (text && index < length - 1) {
        focusCell(index + 1);
      }
    },
    [applyDigits, digits, focusCell, length, onChange],
  );

  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (event.nativeEvent.key !== 'Backspace') {
        return;
      }

      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        onChange(nextDigits.join('').slice(0, length));
        return;
      }

      if (index > 0) {
        focusCell(index - 1);
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        onChange(nextDigits.join('').slice(0, length));
      }
    },
    [digits, focusCell, length, onChange],
  );

  return (
    <View style={styles.row} testID={testID}>
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index] ?? '';
        const filled = success || digit.length > 0;
        const isActive = !disabled && !success && index === activeIndex && digits.length < length;

        return (
          <Pressable
            key={`otp-${index}`}
            accessibilityRole="none"
            onPress={() => focusCell(index)}
            style={[
              styles.cell,
              filled && styles.cellFilled,
              isActive && styles.cellActive,
              error && styles.cellError,
            ]}
          >
            <TextInput
              ref={(node) => {
                refs.current[index] = node;
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={length}
              caretHidden
              textContentType="oneTimeCode"
              autoComplete={index === 0 ? 'sms-otp' : 'off'}
              editable={!disabled && !success}
              selectTextOnFocus
              style={styles.input}
              {...scalableTextProps}
            />
            {!filled && isActive ? (
              <View style={styles.caretWrap}>
                <CaretPulse active color={dark ? AUTH_UI.focus : AUTH_UI.accent} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
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
    input: {
      fontFamily: themeFonts.stat.bold,
      fontSize: dark ? 22 : 24,
      fontWeight: '700',
      color: dark ? AUTH_UI.onCanvas : AUTH_UI.ink,
      textAlign: 'center',
      width: '100%',
      padding: 0,
    },
    caretWrap: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
