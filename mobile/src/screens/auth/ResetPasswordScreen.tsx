import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import {
  AUTH_UI,
  AuthBackButton,
  AuthErrorBanner,
  AuthFlowHeader,
  AuthPremiumField,
  AuthScreen,
  OtpInput,
  PasswordRequirements,
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
import { AUTH_FONTS } from '../../components/auth/authTheme';
import { Text } from '../../components/Text';
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
  const reducedMotion = useReducedMotion();
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

  const enterForm = reducedMotion
    ? undefined
    : FadeInDown.duration(420).delay(140).reduceMotion(ReduceMotion.System);

  return (
    <AuthScreen scrollProps={{ keyboardShouldPersistTaps: 'handled' }} fill>
      <View style={styles.column}>
        <AuthBackButton
          disabled={loading}
          onPress={() => navigation.navigate('ForgotPassword', { email })}
          testID="reset-change-email"
        />

        <AuthFlowHeader
          title={t('forgot.resetTitle')}
          subtitle={t('forgot.codeSentSubtitle', { email })}
          testID="reset-header"
        />

        <Animated.View entering={enterForm} style={[styles.form, shakeStyle]}>
          <View>
            <Text style={styles.codeLabel}>{t('otp.oneTimeCode')}</Text>
            <OtpInput
              dark
              value={code}
              onChange={setCode}
              disabled={loading}
              error={Boolean(formError)}
              testID="reset-otp"
            />
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>{t('otp.didntGet')}</Text>
            {canResend ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('otp.resendCode')}
                disabled={resendLoading || loading}
                onPress={() => void handleResend()}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                style={({ pressed }) => pressed && styles.linkPressed}
                testID="reset-resend"
              >
                <Text style={styles.resendLink}>{t('otp.resendCode')}</Text>
              </Pressable>
            ) : (
              <Text style={styles.countdown}>{t('otp.resendIn', { seconds: remaining })}</Text>
            )}
          </View>

          <View>
            <AuthPremiumField
              dark
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
            <PasswordRequirements dark password={password} />
          </View>

          <AuthPremiumField
            dark
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

          {formError ? (
            <AuthErrorBanner dark message={formError} testID="reset-form-error" />
          ) : null}

          <PrimaryButton
            label={t('forgot.resetSubmit')}
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            testID="reset-submit"
            trailingIcon={ArrowRight}
          />
        </Animated.View>

        <View style={styles.spacer} />
      </View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    column: {
      flex: 1,
      minHeight: 560,
    },
    form: {
      marginTop: 30,
      gap: 16,
    },
    codeLabel: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      color: 'rgba(212,175,55,0.75)',
      marginBottom: 10,
      marginLeft: 4,
    },
    resendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    resendHint: {
      fontFamily: AUTH_FONTS.regular,
      fontSize: 13.5,
      color: 'rgba(228,216,190,0.55)',
      letterSpacing: 0.2,
    },
    resendLink: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 13.5,
      fontWeight: '600',
      color: AUTH_UI.focus,
      letterSpacing: 0.3,
      textDecorationLine: 'underline',
      textDecorationColor: 'rgba(233,200,104,0.4)',
    },
    countdown: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 13.5,
      fontWeight: '600',
      color: 'rgba(233,200,104,0.85)',
      letterSpacing: 0.3,
      fontVariant: ['tabular-nums'],
    },
    linkPressed: {
      opacity: 0.7,
    },
    spacer: {
      flex: 1,
      minHeight: 16,
    },
  });
}
