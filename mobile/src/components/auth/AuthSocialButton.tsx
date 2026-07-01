import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Phone } from 'lucide-react-native';
import { AUTH_UI } from './authTheme';

type AuthSocialButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'google' | 'outline';
  style?: ViewStyle;
  testID?: string;
};

function GoogleMark() {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#4285F4' }}>G</Text>
    </View>
  );
}

export function AuthSocialButton({
  label,
  onPress,
  disabled,
  variant = 'outline',
  style,
  testID,
}: AuthSocialButtonProps) {
  const styles = useMemo(() => createStyles(), []);

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
      {variant === 'google' ? <GoogleMark /> : <Phone size={16} color={AUTH_UI.sageDeep} strokeWidth={2} />}
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
  const styles = useMemo(() => createStyles(), []);

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

function createStyles() {
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
      gap: 9,
      paddingVertical: 14,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
      backgroundColor: AUTH_UI.card,
      shadowColor: AUTH_UI.shadowSm,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 1,
    },
    btnGoogle: {},
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: AUTH_UI.label,
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      backgroundColor: AUTH_UI.bg,
      borderColor: AUTH_UI.borderHover,
    },
  });
}
