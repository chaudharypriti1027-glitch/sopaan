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
      {variant === 'google' ? <GoogleMark /> : <Phone size={16} color="#334155" strokeWidth={2} />}
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
};

export function AuthSocialPair({
  googleLabel,
  otpLabel,
  onGooglePress,
  onOtpPress,
  googleDisabled,
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
      <AuthSocialButton label={otpLabel} onPress={onOtpPress} style={styles.half} />
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
      gap: 8,
      paddingVertical: 13,
      borderRadius: AUTH_UI.btnRadius,
      borderWidth: 1.5,
      borderColor: AUTH_UI.border,
      backgroundColor: AUTH_UI.card,
    },
    btnGoogle: {},
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: '#334155',
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      backgroundColor: '#F8FAFC',
      borderColor: AUTH_UI.borderHover,
    },
  });
}
