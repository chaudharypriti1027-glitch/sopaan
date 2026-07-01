import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AUTH_UI,
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthScreen,
  GhostButton,
  OtpInput,
  useShakeOnError,
} from '../components/auth';
import { Text } from '../components/Text';
import { authApi, parseApiError } from '../api';
import { formatOtpError } from '../auth/otpErrors';
import { normalizeAuthResult } from '../auth/normalizeAuthResult';
import { routeAfterAuthResult } from '../auth/routeAfterSession';
import { useResendCountdown } from '../hooks/useResendCountdown';
import { maskIndianPhone } from '../lib/phone';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/auth';

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
  const { phone } = route.params;
  const setSession = useAuthStore((state) => state.setSession);
  const reducedMotion = useReducedMotion();

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const { remaining, canResend, reset: resetCountdown } = useResendCountdown(30);
  const shakeStyle = useShakeOnError(error);
  const maskedPhone = useMemo(() => maskIndianPhone(phone), [phone]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || verifying || success || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setVerifying(true);
    setError(null);

    try {
      const result = await authApi.verifyOtp({ phone, code });
      setSuccess(true);

      const holdMs = reducedMotion ? 120 : SUCCESS_HOLD_MS;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, holdMs);
      });

      await setSession(normalizeAuthResult(result));
      routeAfterAuthResult(navigation, result);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(formatOtpError(parsed));
      setCode('');
      submittingRef.current = false;
    } finally {
      setVerifying(false);
    }
  }, [code, verifying, success, phone, reducedMotion, setSession, navigation]);

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
      await authApi.requestOtp({ phone });
      resetCountdown();
    } catch (err) {
      setError(formatOtpError(parseApiError(err)));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthScreen
      header={
        <AuthBrandHeader
          title={t('otp.verifyTitle')}
          subtitle={t('otp.codeSentSubtitle', { phone: maskedPhone })}
        />
      }
      footer={
        <View style={styles.footer}>
          {canResend ? (
            <GhostButton
              label={t('otp.resendCode')}
              loading={resendLoading}
              disabled={verifying || success}
              onPress={handleResend}
            />
          ) : (
            <Text style={styles.countdown}>{t('otp.resendIn', { seconds: remaining })}</Text>
          )}
          <GhostButton
            label={t('otp.changeNumber')}
            disabled={verifying || success}
            onPress={() => navigation.goBack()}
          />
        </View>
      }
    >
      <Animated.View style={[styles.form, shakeStyle]}>
        <AuthAnimatedSection index={0}>
          <OtpInput
            value={code}
            onChange={setCode}
            error={Boolean(error)}
            success={success}
            disabled={verifying || success}
            autoFocus
          />
        </AuthAnimatedSection>

        {success ? <OtpSuccessBadge /> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {verifying && !success ? <Text style={styles.verifying}>{t('otp.verifying')}</Text> : null}
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
    alignItems: 'stretch',
  },
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  error: {
    fontSize: 12,
    color: '#C4634F',
    textAlign: 'center',
  },
  verifying: {
    fontSize: 12,
    color: AUTH_UI.muted,
    textAlign: 'center',
  },
  countdown: {
    fontSize: 13,
    color: AUTH_UI.muted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  footer: {
    gap: 10,
  },
});
