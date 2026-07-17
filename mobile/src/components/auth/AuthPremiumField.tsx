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
import { Eye, EyeOff, Lock, Mail, Phone, User, type LucideIcon } from 'lucide-react-native';
import { scalableTextProps } from '../../a11y/textProps';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

export type AuthPremiumFieldVariant = 'text' | 'phone' | 'email' | 'password';

export type AuthPremiumFieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: AuthPremiumFieldVariant;
  error?: string;
  testID?: string;
  /** Compact icon-led pill row (no floating label) — matches the "Classic Premium" auth mockup. */
  dense?: boolean;
  /** Dark glass input on the navy canvas — Sign-in Flow reference. */
  dark?: boolean;
  /** Override the auto-resolved leading icon (dense mode only). */
  icon?: LucideIcon;
};

const PHONE_DIGITS = 10;

/** Keep only national 10-digit mobile numbers (strip +91 / spaces / paste junk). */
function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) {
    digits = digits.slice(-10);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits.slice(0, PHONE_DIGITS);
}

function resolveIcon(variant: AuthPremiumFieldVariant): LucideIcon {
  switch (variant) {
    case 'email':
      return Mail;
    case 'password':
      return Lock;
    case 'phone':
      return Phone;
    default:
      return User;
  }
}

/** Soft tinted icon tile per field type — "Classic Premium" icon treatment. */
function resolveIconTint(variant: AuthPremiumFieldVariant) {
  switch (variant) {
    case 'email':
      return { bg: AUTH_UI.accentSoft, fg: AUTH_UI.accent };
    case 'password':
      return { bg: AUTH_UI.goldSoft, fg: AUTH_UI.goldDeep };
    case 'phone':
      return { bg: AUTH_UI.sageSoft, fg: AUTH_UI.sageDeep };
    default:
      return { bg: AUTH_UI.sageSoft, fg: AUTH_UI.sageDeep };
  }
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
      dense = false,
      dark = false,
      icon,
      ...rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPhone = variant === 'phone';
    const isPassword = variant === 'password';
    const Icon = icon ?? resolveIcon(variant);
    const iconTint = resolveIconTint(variant);
    const styles = useMemo(
      () => createStyles({ focused, hasError: Boolean(error), dense, dark, isPhone }),
      [focused, error, dense, dark, isPhone],
    );

    const setInputRef = (node: TextInput | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const resolvedKeyboard =
      keyboardType ??
      (variant === 'phone' ? 'number-pad' : variant === 'email' ? 'email-address' : 'default');

    const resolvedCapitalize =
      autoCapitalize ?? (variant === 'email' || isPassword || isPhone ? 'none' : 'words');

    if (dark) {
      const goldIcon = 'rgba(212,175,55,0.8)';
      return (
        <View style={styles.field}>
          <Text style={styles.darkLabel}>{label}</Text>
          <View style={styles.darkRow}>
            <View pointerEvents="none" style={styles.darkLeading}>
              <Icon size={17} color={goldIcon} strokeWidth={1.7} />
              {isPhone ? (
                <>
                  <Text style={styles.darkPrefix}>+91</Text>
                  <View style={styles.darkPrefixDivider} />
                </>
              ) : null}
            </View>
            <TextInput
              ref={setInputRef}
              testID={testID}
              accessibilityLabel={label}
              value={value}
              onChangeText={(text) => onChangeText(isPhone ? normalizePhone(text) : text)}
              onFocus={(event) => {
                setFocused(true);
                rest.onFocus?.(event);
              }}
              onBlur={(event) => {
                setFocused(false);
                rest.onBlur?.(event);
              }}
              editable={editable}
              placeholder={placeholder}
              placeholderTextColor="rgba(228,216,190,0.35)"
              keyboardType={resolvedKeyboard}
              inputMode={isPhone ? 'numeric' : variant === 'email' ? 'email' : undefined}
              autoCapitalize={resolvedCapitalize}
              autoCorrect={false}
              autoComplete={isPhone ? 'tel' : variant === 'email' ? 'email' : rest.autoComplete}
              textContentType={
                isPhone
                  ? 'telephoneNumber'
                  : variant === 'email'
                    ? 'emailAddress'
                    : rest.textContentType
              }
              secureTextEntry={isPassword ? !passwordVisible : secureTextEntry}
              underlineColorAndroid="transparent"
              importantForAutofill="yes"
              maxLength={isPhone ? PHONE_DIGITS : rest.maxLength}
              style={styles.darkInput}
              allowFontScaling={scalableTextProps.allowFontScaling}
              maxFontSizeMultiplier={scalableTextProps.maxFontSizeMultiplier}
              autoFocus={rest.autoFocus}
            />
            {isPassword ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                onPress={() => setPasswordVisible((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [styles.darkEyeBtn, pressed && styles.eyeBtnPressed]}
              >
                {passwordVisible ? (
                  <EyeOff size={18} color="rgba(212,175,55,0.85)" strokeWidth={1.8} />
                ) : (
                  <Eye size={18} color="rgba(228,216,190,0.55)" strokeWidth={1.8} />
                )}
              </Pressable>
            ) : null}
          </View>
          {error ? <Text style={styles.darkError}>{error}</Text> : null}
        </View>
      );
    }

    return (
      <View style={styles.field}>
        {dense ? null : <Text style={styles.label}>{label}</Text>}
        <View style={styles.inputWrap}>
          {dense && isPhone ? (
            <>
              <View style={styles.denseIcon} pointerEvents="none">
                <View style={[styles.denseIconTile, { backgroundColor: iconTint.bg }]}>
                  <Icon size={16} color={iconTint.fg} strokeWidth={2} />
                </View>
              </View>
              <View style={styles.densePrefix} pointerEvents="none">
                <Text style={styles.densePrefixCode}>+91</Text>
              </View>
            </>
          ) : dense ? (
            <View style={styles.denseIcon} pointerEvents="none">
              <View style={[styles.denseIconTile, { backgroundColor: iconTint.bg }]}>
                <Icon size={16} color={iconTint.fg} strokeWidth={2} />
              </View>
            </View>
          ) : isPhone ? (
            <View style={styles.prefix} pointerEvents="none">
              <Phone size={14} color={AUTH_UI.accent} strokeWidth={2} />
              <Text style={styles.prefixCode}>+91</Text>
            </View>
          ) : null}

          <TextInput
            ref={ref}
            testID={testID}
            accessibilityLabel={dense ? label : undefined}
            {...rest}
            {...scalableTextProps}
            value={value}
            onChangeText={(text) => onChangeText(isPhone ? normalizePhone(text) : text)}
            onFocus={(event) => {
              setFocused(true);
              rest.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              rest.onBlur?.(event);
            }}
            editable={editable}
            placeholder={placeholder}
            placeholderTextColor={AUTH_UI.faint}
            keyboardType={resolvedKeyboard}
            autoCapitalize={resolvedCapitalize}
            autoCorrect={variant === 'email' || isPassword ? false : rest.autoCorrect}
            secureTextEntry={isPassword ? !passwordVisible : secureTextEntry}
            underlineColorAndroid="transparent"
            importantForAutofill="yes"
            style={[
              styles.input,
              dense && styles.inputDense,
              dense && isPhone && styles.inputDensePhone,
              !dense && isPhone && styles.inputPhone,
              isPassword && styles.inputEye,
              rest.style,
            ]}
          />

          {isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [styles.eyeBtn, pressed && styles.eyeBtnPressed]}
            >
              {passwordVisible ? (
                <EyeOff size={18} color={AUTH_UI.accent} strokeWidth={2} />
              ) : (
                <Eye size={18} color={AUTH_UI.label} strokeWidth={2} />
              )}
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

function createStyles(state: {
  focused: boolean;
  hasError: boolean;
  dense: boolean;
  dark: boolean;
  isPhone?: boolean;
}) {
  const borderColor = state.hasError
    ? '#C4634F'
    : state.focused
      ? AUTH_UI.focus
      : AUTH_UI.border;

  const darkBorder = state.hasError
    ? 'rgba(224,122,95,0.75)'
    : state.focused
      ? 'rgba(233,200,104,0.9)'
      : 'rgba(240,212,136,0.24)';

  return StyleSheet.create({
    field: {
      marginBottom: state.dense || state.dark ? 0 : 14,
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
    darkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 58,
      paddingHorizontal: 18,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: state.focused ? 1.5 : 1,
      borderColor: darkBorder,
      ...(state.focused
        ? {
            shadowColor: AUTH_UI.gold,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.16,
            shadowRadius: 6,
          }
        : {}),
    },
    darkLeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    },
    darkPrefix: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 16,
      fontWeight: '600',
      color: AUTH_UI.onCanvas,
      letterSpacing: 0.3,
    },
    darkPrefixDivider: {
      width: 1,
      height: 26,
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    darkInput: {
      flex: 1,
      minWidth: 40,
      minHeight: 48,
      paddingVertical: Platform.OS === 'ios' ? 14 : 12,
      paddingHorizontal: 0,
      margin: 0,
      // Custom fontFamily + fontWeight often breaks digit entry on Android TextInputs.
      fontFamily: state.isPhone ? undefined : AUTH_FONTS.regular,
      fontSize: 16,
      color: AUTH_UI.onCanvas,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
    },
    darkEyeBtn: {
      width: 34,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    darkError: {
      fontSize: 12,
      color: '#E07A5F',
      marginTop: 8,
      marginLeft: 4,
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
    denseIcon: {
      position: 'absolute',
      left: 8,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      zIndex: 1,
    },
    densePrefix: {
      position: 'absolute',
      left: 46,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      zIndex: 1,
    },
    densePrefixCode: {
      fontSize: 14,
      fontWeight: '700',
      color: AUTH_UI.accent,
    },
    denseIconTile: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
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
    inputDense: {
      paddingLeft: 50,
      paddingVertical: 15,
      borderWidth: 1,
      borderColor: state.hasError
        ? '#C4634F'
        : state.focused
          ? AUTH_UI.goldMid
          : 'rgba(28,36,80,0.1)',
      backgroundColor: AUTH_UI.cardElevated,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: state.focused ? 0.08 : 0.03,
      shadowRadius: 10,
      elevation: 1,
    },
    inputDensePhone: {
      paddingLeft: 88,
    },
    inputPhone: {
      paddingLeft: 72,
    },
    inputEye: {
      paddingRight: 44,
    },
    eyeBtn: {
      position: 'absolute',
      right: 10,
      top: 0,
      bottom: 0,
      width: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyeBtnPressed: {
      opacity: 0.6,
    },
    error: {
      fontSize: 11,
      color: '#C4634F',
      marginTop: 6,
      marginLeft: 4,
    },
  });
}
