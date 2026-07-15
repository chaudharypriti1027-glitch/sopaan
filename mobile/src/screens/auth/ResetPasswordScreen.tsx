import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthErrorBanner,
  AuthFormCard,
  AuthFormIntro,
  AuthPremiumField,
  AuthPremiumHero,
  AuthScreen,
  GhostButton,
  OtpInput,
  PasswordRequirements,
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
import { Text } from '../../components/Text';
import { AUTH_UI } from '../../components/auth/authTheme';
import { authApi, parseApiError } from '../../api';
import { formatOtpError } from '../../auth/otpErrors';
import { completeStudentLogin, isAdminAppAccessError } from '../../auth/studentSession';
import { routeAfterAuthResult } from '../../auth/routeAfterSession';
import { useResendCountdown } from '../../hooks/useResendCountdown';
import { isStrongPassword } from '../../lib/passwordPolicy';
import type { AuthStackParamList, RootStackParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>,
  NativeStackNavigationProp<RootStackParamList>
>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;
  const styles = useMemo(() => createStyles(), []);

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const { remaining, canResend, reset: resetCountdown } = useResendCountdown(30);
  const shakeStyle = useShakeOnError(formError);

  const canSubmit =
    code.length === 6 && isStrongPassword(password) && password === confirm && !loading;

  const handleResend = useCallback(async () => {
    if (!canResend || resendLoading || loading) return;
    setResendLoading(true);
    setFormError(null);
    try {
      await authApi.forgotPassword({ email });
      resetCountdown();
    } catch (err) {
      setFormError(formatOtpError(parseApiError(err)));
    } finally {
      setResendLoading(false);
    }
  }, [canResend, resendLoading, loading, email, resetCountdown]);

  const handleSubmit = async () => {
    setFormError(null);
    setPasswordError(undefined);

    if (code.length !== 6) {
      setFormError(t('otp.invalidOtp'));
      return;
    }
    if (!isStrongPassword(password)) {
      setPasswordError(t('forgot.passwordWeak'));
      return;
    }
    if (password !== confirm) {
      setPasswordError(t('forgot.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.resetPassword({ email, code, password });
      const ok = await completeStudentLogin(navigation, result, {
        afterSession: (session) => routeAfterAuthResult(navigation, session),
      });
      if (!ok) {
        setFormError(t('login.adminUseWebConsole'));
      }
    } catch (err) {
      if (isAdminAppAccessError(err)) {
        setFormError(t('login.adminUseWebConsole'));
        return;
      }
      const parsed = parseApiError(err);
      setFormError(formatOtpError(parsed));
      if (parsed.code === 'INVALID_OTP') {
        setCode('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
      footer={
        <View style={styles.footer}>
          {canResend ? (
            <GhostButton
              label={t('otp.resendCode')}
              loading={resendLoading}
              disabled={loading}
              onPress={() => void handleResend()}
              testID="reset-resend"
            />
          ) : (
            <Text style={styles.countdown}>{t('otp.resendIn', { seconds: remaining })}</Text>
          )}
          <GhostButton
            label={t('otp.changeEmail')}
            disabled={loading}
            onPress={() => navigation.navigate('ForgotPassword', { email })}
            testID="reset-change-email"
          />
        </View>
      }
    >
      <AuthPremiumHero
        variant="verify"
        subtitle={t('forgot.codeSentSubtitle', { email })}
      />

      <Animated.View entering={FadeInDown.duration(400).delay(80)} style={shakeStyle}>
        <AuthFormCard overlap premium>
          <AuthFormIntro title={t('forgot.resetTitle')} subtitle={t('forgot.resetSubtitle')} />

          <AuthAnimatedSection index={0}>
            <OtpInput
              value={code}
              onChange={setCode}
              disabled={loading}
              error={Boolean(formError)}
              testID="reset-otp"
            />
          </AuthAnimatedSection>

          <AuthAnimatedSection index={1}>
            <AuthPremiumField
              dense
              variant="password"
              label={t('forgot.newPassword')}
              value={password}
              placeholder={t('forgot.newPasswordPlaceholder')}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(undefined);
                if (formError) setFormError(null);
              }}
              error={passwordError}
              editable={!loading}
              testID="reset-password"
            />
            <PasswordRequirements password={password} />
          </AuthAnimatedSection>

          <AuthAnimatedSection index={2}>
            <AuthPremiumField
              dense
              variant="password"
              label={t('forgot.confirmPassword')}
              value={confirm}
              placeholder={t('forgot.confirmPasswordPlaceholder')}
              onChangeText={(value) => {
                setConfirm(value);
                if (passwordError) setPasswordError(undefined);
                if (formError) setFormError(null);
              }}
              editable={!loading}
              testID="reset-confirm"
            />
          </AuthAnimatedSection>

          {formError ? (
            <AuthErrorBanner message={formError} testID="reset-form-error" />
          ) : null}

          <AuthAnimatedSection index={3}>
            <PrimaryButton
              label={t('forgot.resetSubmit')}
              loading={loading}
              disabled={!canSubmit}
              onPress={() => void handleSubmit()}
              testID="reset-submit"
            />
          </AuthAnimatedSection>
        </AuthFormCard>
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    footer: {
      gap: 8,
      alignItems: 'center',
    },
    countdown: {
      fontSize: 13,
      fontWeight: '600',
      color: AUTH_UI.muted,
      textAlign: 'center',
      minHeight: 44,
      textAlignVertical: 'center',
      paddingTop: 12,
    },
  });
}
