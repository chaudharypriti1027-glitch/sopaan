import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Check, ShieldCheck } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AUTH_UI,
  AuthAltLinks,
  AuthBackButton,
  AuthErrorBanner,
  AuthFlowHeader,
  AuthScreen,
  OtpInput,
  useShakeOnError,
} from '../components/auth';
import { AUTH_FONTS } from '../components/auth/authTheme';
import { Text } from '../components/Text';
import { authApi, parseApiError } from '../api';
import { formatOtpError } from '../auth/otpErrors';
import { completeStudentLogin } from '../auth/studentSession';
import { routeAfterAuthResult } from '../auth/routeAfterSession';
import { useResendCountdown } from '../hooks/useResendCountdown';
import { maskIndianPhone } from '../lib/phone';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';

type OtpNav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'Otp'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type OtpRoute = RouteProp<AuthStackParamList, 'Otp'>;

const SUCCESS_HOLD_MS = 680;

function OtpSuccessBadge() {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.4);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  }, [opacity, reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.successBadge, style]}>
      <Check size={28} color="#10B981" strokeWidth={2.5} />
    </Animated.View>
  );
}

export function OtpScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<OtpNav>();
  const route = useRoute<OtpRoute>();
  const { phone, email, privacyConsent } = route.params;
  const reducedMotion = useReducedMotion();

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const { remaining, canResend, reset: resetCountdown } = useResendCountdown(30);
  const shakeStyle = useShakeOnError(error);
  const maskedPhone = useMemo(() => (phone ? maskIndianPhone(phone) : ''), [phone]);
  const destinationLabel = email ?? maskedPhone;

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || verifying || success || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setVerifying(true);
    setError(null);

    try {
      const result = await authApi.verifyOtp({
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        code,
        privacyConsent,
      });
      setSuccess(true);

      const holdMs = reducedMotion ? 120 : SUCCESS_HOLD_MS;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, holdMs);
      });

      const ok = await completeStudentLogin(navigation, result, {
        afterSession: (session) => routeAfterAuthResult(navigation, session),
      });
      if (!ok) {
        submittingRef.current = false;
        return;
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setError(formatOtpError(parsed));
      setCode('');
      submittingRef.current = false;
    } finally {
      setVerifying(false);
    }
  }, [code, verifying, success, phone, email, privacyConsent, reducedMotion, navigation]);

  useEffect(() => {
    if (code.length === 6) {
      void handleVerify();
    }
  }, [code, handleVerify]);

  const handleResend = async () => {
    if (!canResend || resendLoading || verifying || success) {
      return;
    }

    setResendLoading(true);
    setError(null);
    setCode('');
    submittingRef.current = false;

    try {
      if (phone) {
        await authApi.requestOtp({ phone });
      } else if (email) {
        await authApi.requestOtp({ email });
      }
      resetCountdown();
    } catch (err) {
      setError(formatOtpError(parseApiError(err)));
    } finally {
      setResendLoading(false);
    }
  };

  const enterForm = reducedMotion
    ? undefined
    : FadeInDown.duration(420).delay(140).reduceMotion(ReduceMotion.System);
  const enterFooter = reducedMotion
    ? undefined
    : FadeInDown.duration(380).delay(240).reduceMotion(ReduceMotion.System);

  return (
    <AuthScreen scrollProps={{ keyboardShouldPersistTaps: 'handled' }} fill>
      <View style={styles.column}>
        <AuthBackButton
          disabled={verifying || success}
          testID="otp-verify-back"
        />

        <AuthFlowHeader
          title={t('otp.verifyTitle')}
          subtitle={t('otp.codeSentTo')}
          testID="otp-verify-header"
          accessory={
            <>
              <Text style={styles.phoneLabel}>{destinationLabel}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={phone ? t('otp.changeNumber') : t('otp.changeEmail')}
                disabled={verifying || success}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => pressed && styles.linkPressed}
              >
                <Text style={styles.changeLink}>{t('otp.change')}</Text>
              </Pressable>
            </>
          }
        />

        <Animated.View entering={enterForm} style={[styles.form, shakeStyle]}>
          <Text style={styles.codeLabel}>{t('otp.oneTimeCode')}</Text>
          <OtpInput
            dark
            value={code}
            onChange={setCode}
            error={Boolean(error)}
            success={success}
            disabled={verifying || success}
            autoFocus
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>{t('otp.didntGet')}</Text>
            {canResend ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('otp.resendCode')}
                disabled={resendLoading || verifying || success}
                onPress={() => void handleResend()}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                style={({ pressed }) => pressed && styles.linkPressed}
              >
                <Text style={styles.resendLink}>{t('otp.resendCode')}</Text>
              </Pressable>
            ) : (
              <Text style={styles.countdown}>{t('otp.resendIn', { seconds: remaining })}</Text>
            )}
          </View>

          {success ? <OtpSuccessBadge /> : null}

          {error ? <AuthErrorBanner dark message={error} testID="otp-verify-error" /> : null}

          {verifying && !success ? (
            <Text style={styles.verifying}>{t('otp.verifying')}</Text>
          ) : null}

          <View style={styles.trustRow}>
            <ShieldCheck size={13} color="rgba(212,175,55,0.75)" strokeWidth={2.1} />
            <Text style={styles.trustText}>{t('otp.numberPrivate')}</Text>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={enterFooter}>
          <AuthAltLinks
            dark
            links={[
              {
                label: phone ? t('otp.changeNumber') : t('otp.changeEmail'),
                onPress: verifying || success ? undefined : () => navigation.goBack(),
                testID: 'otp-verify-change',
              },
              {
                label: t('otp.cantSignIn'),
                onPress:
                  verifying || success
                    ? undefined
                    : () => navigation.navigate('ForgotPassword'),
                testID: 'otp-verify-help',
              },
            ]}
          />
        </Animated.View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    minHeight: 560,
  },
  form: {
    marginTop: 34,
    gap: 16,
    alignItems: 'stretch',
  },
  codeLabel: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: 'rgba(212,175,55,0.75)',
    marginBottom: -4,
    marginLeft: 4,
  },
  phoneLabel: {
    fontFamily: AUTH_FONTS.semibold,
    fontSize: 15.5,
    fontWeight: '600',
    color: AUTH_UI.onCanvas,
    letterSpacing: 0.5,
  },
  changeLink: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 13.5,
    fontWeight: '500',
    color: AUTH_UI.focus,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(233,200,104,0.4)',
  },
  linkPressed: {
    opacity: 0.7,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
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
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  verifying: {
    fontSize: 12,
    color: 'rgba(228,216,190,0.55)',
    textAlign: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },
  trustText: {
    fontFamily: AUTH_FONTS.regular,
    fontSize: 12.5,
    color: 'rgba(228,216,190,0.55)',
    letterSpacing: 0.3,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
});
