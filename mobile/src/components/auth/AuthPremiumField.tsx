import { forwardRef, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, Phone } from 'lucide-react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { AUTH_UI } from './authTheme';

export type AuthPremiumFieldVariant = 'text' | 'phone' | 'email' | 'password';

export type AuthPremiumFieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: AuthPremiumFieldVariant;
  error?: string;
  testID?: string;
};

const PHONE_DIGITS = 10;

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, '').slice(0, PHONE_DIGITS);
}

export const AuthPremiumField = forwardRef<TextInput, AuthPremiumFieldProps>(
  function AuthPremiumField(
    {
      label,
      value,
      onChangeText,
      variant = 'text',
      error,
      testID,
      editable = true,
      placeholder,
      keyboardType,
      autoCapitalize,
      secureTextEntry,
      ...rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPhone = variant === 'phone';
    const isPassword = variant === 'password';
    const styles = useMemo(
      () => createStyles({ focused, hasError: Boolean(error) }),
      [focused, error],
    );

    const resolvedKeyboard =
      keyboardType ??
      (variant === 'phone' ? 'phone-pad' : variant === 'email' ? 'email-address' : 'default');

    const resolvedCapitalize =
      autoCapitalize ?? (variant === 'email' || isPassword ? 'none' : 'words');

    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrap}>
          {isPhone ? (
            <View style={styles.prefix} pointerEvents="none">
              <Phone size={14} color={AUTH_UI.accent} strokeWidth={2} />
              <Text style={styles.prefixCode}>+91</Text>
            </View>
          ) : null}

          <TextInput
            ref={ref}
            testID={testID}
            value={value}
            onChangeText={(text) => onChangeText(isPhone ? normalizePhone(text) : text)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            editable={editable}
            placeholder={placeholder}
            placeholderTextColor={AUTH_UI.faint}
            keyboardType={resolvedKeyboard}
            autoCapitalize={resolvedCapitalize}
            autoCorrect={variant === 'email' || isPassword ? false : rest.autoCorrect}
            secureTextEntry={isPassword ? !passwordVisible : secureTextEntry}
            style={[styles.input, isPhone && styles.inputPhone, isPassword && styles.inputEye]}
            {...scalableTextProps}
            {...rest}
          />

          {isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              onPress={() => setPasswordVisible((v) => !v)}
              style={styles.eyeBtn}
            >
              {passwordVisible ? (
                <EyeOff size={18} color={AUTH_UI.faint} />
              ) : (
                <Eye size={18} color={AUTH_UI.faint} />
              )}
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

function createStyles(state: { focused: boolean; hasError: boolean }) {
  const borderColor = state.hasError
    ? '#F87171'
    : state.focused
      ? AUTH_UI.focus
      : AUTH_UI.border;

  return StyleSheet.create({
    field: {
      marginBottom: 14,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: AUTH_UI.label,
      marginBottom: 6,
      marginLeft: 4,
    },
    inputWrap: {
      position: 'relative',
    },
    prefix: {
      position: 'absolute',
      left: 16,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      zIndex: 1,
    },
    prefixCode: {
      fontSize: 13,
      fontWeight: '700',
      color: AUTH_UI.accent,
      borderRightWidth: 1.5,
      borderRightColor: AUTH_UI.border,
      paddingRight: 8,
    },
    input: {
      width: '100%',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: AUTH_UI.inputRadius,
      borderWidth: 1.5,
      borderColor,
      backgroundColor: AUTH_UI.card,
      fontSize: 14,
      fontWeight: '500',
      color: AUTH_UI.ink,
      ...(state.focused
        ? {
            shadowColor: AUTH_UI.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.12,
            shadowRadius: 3,
          }
        : {}),
    },
    inputPhone: {
      paddingLeft: 72,
    },
    inputEye: {
      paddingRight: 44,
    },
    eyeBtn: {
      position: 'absolute',
      right: 14,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    error: {
      fontSize: 11,
      color: '#EF4444',
      marginTop: 6,
      marginLeft: 4,
    },
  });
}
