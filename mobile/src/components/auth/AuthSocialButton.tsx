import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Phone } from 'lucide-react-native';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthSocialButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'google' | 'outline';
  style?: ViewStyle;
  testID?: string;
  /** Dark glass button on the navy canvas — Sign-in Flow reference. */
  dark?: boolean;
};

/** Full-color Google "G" mark — matches the multi-brand icon in the reference mockup. */
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.6 12.2c0-.6-.1-1.3-.2-1.9H12v3.6h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8z"
      />
      <Path
        fill="#34A853"
        d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.6 7.6 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.5H1.8C1 8.1.6 9.9.6 11.6s.4 3.5 1.2 5.1l3.8-2.9z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.9c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.4 15.1.3 12 .3 7.6.3 3.7 2.7 1.8 6.5l3.8 2.9C6.5 6.8 9 4.9 12 4.9z"
      />
    </Svg>
  );
}

export function AuthSocialButton({
  label,
  onPress,
  disabled,
  variant = 'outline',
  style,
  testID,
  dark = false,
}: AuthSocialButtonProps) {
  const styles = useMemo(() => createStyles(dark), [dark]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === 'google' && styles.btnGoogle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {dark ? (
        <GoogleMark />
      ) : (
        <View style={[styles.iconTile, variant === 'google' ? styles.iconTileGoogle : styles.iconTilePhone]}>
          {variant === 'google' ? <GoogleMark /> : <Phone size={15} color={AUTH_UI.sageDeep} strokeWidth={2.2} />}
        </View>
      )}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

type AuthSocialPairProps = {
  googleLabel: string;
  otpLabel: string;
  onGooglePress?: () => void;
  onOtpPress?: () => void;
  googleDisabled?: boolean;
  otpDisabled?: boolean;
};

export function AuthSocialPair({
  googleLabel,
  otpLabel,
  onGooglePress,
  onOtpPress,
  googleDisabled,
  otpDisabled,
}: AuthSocialPairProps) {
  const styles = useMemo(() => createStyles(false), []);

  return (
    <View style={styles.pair}>
      <AuthSocialButton
        label={googleLabel}
        variant="google"
        onPress={onGooglePress}
        disabled={googleDisabled}
        style={styles.half}
      />
      <AuthSocialButton
        label={otpLabel}
        onPress={onOtpPress}
        disabled={otpDisabled}
        style={styles.half}
      />
    </View>
  );
}

function createStyles(dark: boolean) {
  return StyleSheet.create({
    pair: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    half: {
      flex: 1,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: dark ? 12 : 9,
      minHeight: dark ? 54 : undefined,
      paddingVertical: 14,
      borderRadius: dark ? AUTH_UI.btnRadius : 15,
      borderWidth: 1,
      borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,36,80,0.1)',
      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : AUTH_UI.cardElevated,
      ...(dark
        ? {}
        : {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 1,
          }),
    },
    btnGoogle: {},
    iconTile: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconTileGoogle: {
      backgroundColor: '#EDF3FE',
    },
    iconTilePhone: {
      backgroundColor: AUTH_UI.sageSoft,
    },
    label: {
      fontFamily: dark ? AUTH_FONTS.medium : AUTH_FONTS.bold,
      fontSize: dark ? 15 : 13,
      color: dark ? AUTH_UI.onCanvas : AUTH_UI.label,
      letterSpacing: dark ? 0.3 : undefined,
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      backgroundColor: dark ? 'rgba(255,255,255,0.09)' : '#F0EDE3',
      borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(28,36,80,0.16)',
    },
  });
}
