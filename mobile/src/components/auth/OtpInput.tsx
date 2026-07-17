import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
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
  dark?: boolean;
};

function sanitizeDigits(raw: string, length: number) {
  return raw.replace(/\D/g, '').slice(0, length);
}

/**
 * OTP entry with one real TextInput on top of visual digit boxes.
 * The input stays fully interactive (not opacity-hidden) so Android accepts digits.
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
    if (!autoFocus) {
      return undefined;
    }
    const id = setTimeout(focusInput, 120);
    return () => clearTimeout(id);
  }, [autoFocus, focusInput]);

  return (
    <View style={styles.wrap} testID={testID} collapsable={false}>
      <View style={styles.row} pointerEvents="none">
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
            >
              <Text style={styles.digit}>{digit || (isActive ? '|' : '')}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => onChange(sanitizeDigits(text, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        editable={!disabled && !success}
        showSoftInputOnFocus
        caretHidden
        autoFocus={autoFocus}
        underlineColorAndroid="transparent"
        importantForAutofill="yes"
        style={styles.realInput}
        testID={`${testID}-field`}
        selectionColor="transparent"
        onPressIn={focusInput}
      />
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
    wrap: {
      position: 'relative',
      width: '100%',
      minHeight: 56,
    },
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
    realInput: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
      color: 'transparent',
      fontSize: Platform.OS === 'ios' ? 1 : 16,
      letterSpacing: 0,
      backgroundColor: 'transparent',
      // Android ignores keypresses on near-invisible inputs — keep slightly visible.
      opacity: Platform.OS === 'android' ? 0.25 : 0.08,
      padding: 0,
      margin: 0,
    },
  });
}
