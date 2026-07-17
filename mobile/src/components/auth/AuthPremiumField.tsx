import { forwardRef, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

export type AuthPremiumFieldVariant = 'text' | 'phone' | 'email' | 'password';

export type AuthPremiumFieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: AuthPremiumFieldVariant;
  error?: string;
  testID?: string;
  /** @deprecated kept for call-site compatibility */
  dense?: boolean;
  /** Dark glass input on the navy canvas — Sign-in Flow reference. */
  dark?: boolean;
  /** @deprecated kept for call-site compatibility */
  icon?: unknown;
};

const PHONE_DIGITS = 10;

/** Keep only national 10-digit mobile numbers. */
function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10) {
    // +91XXXXXXXXXX / 91XXXXXXXXXX paste → last 10
    digits = digits.slice(-10);
  }
  return digits.slice(0, PHONE_DIGITS);
}

/**
 * Auth text field — deliberately simple so Android/iOS always accept typing.
 * Avoids flex-row icon traps, custom TextInput fonts, and overlay Pressables.
 */
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
      dark = false,
      dense: _dense,
      icon: _icon,
      style: styleProp,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      autoFocus,
      maxLength,
      ..._rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPhone = variant === 'phone';
    const isPassword = variant === 'password';
    const isEmail = variant === 'email';
    const styles = useMemo(
      () => createStyles({ focused, hasError: Boolean(error), dark, isPhone }),
      [focused, error, dark, isPhone],
    );

    const resolvedKeyboard =
      keyboardType ??
      (isPhone ? 'phone-pad' : isEmail ? 'email-address' : 'default');

    return (
      <View style={styles.field} collapsable={false}>
        <Text style={dark ? styles.darkLabel : styles.label}>{label}</Text>

        <View style={dark ? styles.darkShell : styles.lightShell} collapsable={false}>
          {isPhone ? (
            <Text style={dark ? styles.darkPrefix : styles.lightPrefix} pointerEvents="none">
              +91
            </Text>
          ) : null}

          <TextInput
            ref={ref}
            testID={testID}
            accessibilityLabel={label}
            value={value}
            onChangeText={(text) => onChangeText(isPhone ? normalizePhone(text) : text)}
            onFocus={(event) => {
              setFocused(true);
              onFocusProp?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlurProp?.(event);
            }}
            editable={editable}
            placeholder={placeholder}
            placeholderTextColor={dark ? 'rgba(228,216,190,0.35)' : AUTH_UI.faint}
            keyboardType={resolvedKeyboard}
            autoCapitalize={autoCapitalize ?? (isEmail || isPassword || isPhone ? 'none' : 'sentences')}
            autoCorrect={false}
            autoComplete={isPhone ? 'tel' : isEmail ? 'email' : isPassword ? 'password' : 'off'}
            textContentType={
              isPhone ? 'telephoneNumber' : isEmail ? 'emailAddress' : isPassword ? 'password' : 'none'
            }
            secureTextEntry={isPassword ? !passwordVisible : Boolean(secureTextEntry)}
            underlineColorAndroid="transparent"
            importantForAutofill="yes"
            maxLength={isPhone ? PHONE_DIGITS : maxLength}
            autoFocus={autoFocus}
            showSoftInputOnFocus
            caretHidden={false}
            contextMenuHidden={false}
            style={[dark ? styles.darkInput : styles.lightInput, styleProp]}
          />

          {isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={8}
              style={styles.eyeBtn}
            >
              {passwordVisible ? (
                <EyeOff
                  size={18}
                  color={dark ? 'rgba(212,175,55,0.85)' : AUTH_UI.accent}
                  strokeWidth={1.8}
                />
              ) : (
                <Eye
                  size={18}
                  color={dark ? 'rgba(228,216,190,0.55)' : AUTH_UI.label}
                  strokeWidth={1.8}
                />
              )}
            </Pressable>
          ) : null}
        </View>

        {error ? <Text style={dark ? styles.darkError : styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

function createStyles(state: {
  focused: boolean;
  hasError: boolean;
  dark: boolean;
  isPhone: boolean;
}) {
  const darkBorder = state.hasError
    ? 'rgba(224,122,95,0.75)'
    : state.focused
      ? 'rgba(233,200,104,0.9)'
      : 'rgba(240,212,136,0.24)';

  const lightBorder = state.hasError
    ? '#C4634F'
    : state.focused
      ? AUTH_UI.focus
      : AUTH_UI.border;

  return StyleSheet.create({
    field: {
      width: '100%',
      marginBottom: 0,
    },
    darkLabel: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      color: 'rgba(212,175,55,0.75)',
      marginBottom: 10,
      marginLeft: 4,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: AUTH_UI.label,
      marginBottom: 6,
      marginLeft: 4,
    },
    darkShell: {
      position: 'relative',
      width: '100%',
      minHeight: 56,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: state.focused ? 1.5 : 1,
      borderColor: darkBorder,
      justifyContent: 'center',
    },
    lightShell: {
      position: 'relative',
      width: '100%',
      minHeight: 52,
      borderRadius: AUTH_UI.inputRadius,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1.5,
      borderColor: lightBorder,
      justifyContent: 'center',
    },
    darkPrefix: {
      position: 'absolute',
      left: 16,
      top: 0,
      bottom: 0,
      textAlignVertical: 'center',
      lineHeight: Platform.OS === 'ios' ? 56 : undefined,
      fontSize: 16,
      fontWeight: '600',
      color: AUTH_UI.onCanvas,
      zIndex: 1,
    },
    lightPrefix: {
      position: 'absolute',
      left: 16,
      top: 0,
      bottom: 0,
      textAlignVertical: 'center',
      lineHeight: Platform.OS === 'ios' ? 52 : undefined,
      fontSize: 14,
      fontWeight: '700',
      color: AUTH_UI.accent,
      zIndex: 1,
    },
    darkInput: {
      width: '100%',
      minHeight: 56,
      paddingVertical: Platform.OS === 'ios' ? 16 : 14,
      paddingLeft: state.isPhone ? 56 : 16,
      paddingRight: 44,
      margin: 0,
      fontSize: 17,
      color: AUTH_UI.onCanvas,
      // System font — custom fonts on Android TextInput often swallow keystrokes.
      fontFamily: Platform.OS === 'ios' ? undefined : undefined,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const, includeFontPadding: false } : null),
    },
    lightInput: {
      width: '100%',
      minHeight: 52,
      paddingVertical: Platform.OS === 'ios' ? 14 : 12,
      paddingLeft: state.isPhone ? 56 : 16,
      paddingRight: 44,
      margin: 0,
      fontSize: 15,
      color: AUTH_UI.ink,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const, includeFontPadding: false } : null),
    },
    eyeBtn: {
      position: 'absolute',
      right: 12,
      top: 0,
      bottom: 0,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    darkError: {
      fontSize: 12,
      color: '#E07A5F',
      marginTop: 8,
      marginLeft: 4,
    },
    error: {
      fontSize: 11,
      color: '#C4634F',
      marginTop: 6,
      marginLeft: 4,
    },
  });
}
