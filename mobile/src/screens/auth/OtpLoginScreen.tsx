import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  AUTH_UI,
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthPremiumField,
  AuthScreen,
  GhostButton,
  OtpInput,
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
import { Text } from '../../components/Text';
import { parseApiError, privacyApi } from '../../api';
import { useAuth } from '../../auth';
import { useOnboarding } from '../../auth/OnboardingContext';
import { useResendCountdown } from '../../hooks/useResendCountdown';
import { maskIndianPhone } from '../../lib/phone';
import type { AuthStackParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type OtpLoginNav = NativeStackNavigationProp<AuthStackParamList, 'OtpLogin'>;

const PRIVACY_URL = 'https://sopaan.app/privacy';
const TERMS_URL = 'https://sopaan.app/terms';

type ConsentRowProps = {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function ConsentRow({ checked, onToggle, children }: ConsentRowProps) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onToggle} style={styles.consentRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <View style={styles.consentCopy}>{children}</View>
    </Pressable>
  );
}

export function OtpLoginScreen() {
  const navigation = useNavigation<OtpLoginNav>();
  const { requestOtp, verifyOtp } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { t } = useTranslation(['auth', 'common']);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyVersion, setPolicyVersion] = useState('2025-06-01');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [acceptedAi, setAcceptedAi] = useState(false);

  const { remaining, canResend, reset: resetCountdown } = useResendCountdown(30);
  const shakeStyle = useShakeOnError(error);
  const maskedPhone = useMemo(() => maskIndianPhone(phone.trim()), [phone]);

  useEffect(() => {
    void privacyApi.getPolicy().then((policy) => setPolicyVersion(policy.version)).catch(() => {});
  }, []);

  const handleSendOtp = async () => {
    if (phone.trim().length < 10) {
      setError(t('otp.invalidPhone'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await requestOtp({ phone: phone.trim() });
      setOtpSent(true);
      resetCountdown();
      Alert.alert(t('otp.otpSentTitle'), t('otp.otpSentBody'));
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      setError(t('otp.invalidOtp'));
      return;
    }

    if (!acceptedPolicy || !acceptedAi) {
      setError(t('otp.consentRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtp({
        phone: phone.trim(),
        code: code.trim(),
        privacyConsent: {
          policyVersion,
          aiProcessing: true,
        },
      });
      await completeOnboarding();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!canResend || resendLoading || loading) {
      return;
    }

    setResendLoading(true);
    setError(null);
    setCode('');

    try {
      await requestOtp({ phone: phone.trim() });
      resetCountdown();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setResendLoading(false);
    }
  }, [canResend, loading, phone, requestOtp, resendLoading, resetCountdown]);

  const resetOtpPhase = () => {
    setOtpSent(false);
    setCode('');
    setError(null);
    setAcceptedPolicy(false);
    setAcceptedAi(false);
  };

  return (
    <AuthScreen
      header={
        <AuthBrandHeader
          title={t('otp.title')}
          subtitle={otpSent ? `${t('otp.subtitle')} ${maskedPhone}` : t('otp.subtitle')}
          badge={otpSent ? t('otp.phoneVerification') : undefined}
        />
      }
      footer={
        <View style={styles.footer}>
          {!otpSent ? (
            <GhostButton
              label={t('common:back')}
              onPress={() => navigation.goBack()}
              disabled={loading}
            />
          ) : null}
          <PrimaryButton
            label={otpSent ? t('otp.verify') : t('otp.request')}
            loading={loading}
            disabled={otpSent && (!acceptedPolicy || !acceptedAi)}
            onPress={otpSent ? handleVerify : handleSendOtp}
          />
          {otpSent ? (
            <>
              {canResend ? (
                <GhostButton
                  label={t('otp.resendCode')}
                  loading={resendLoading}
                  disabled={loading}
                  onPress={handleResend}
                />
              ) : (
                <Text style={styles.countdown}>{t('otp.resendIn', { seconds: remaining })}</Text>
              )}
              <GhostButton label={t('otp.changeNumber')} onPress={resetOtpPhase} disabled={loading} />
            </>
          ) : null}
        </View>
      }
    >
      <Animated.View style={shakeStyle}>
        {!otpSent ? (
          <AuthAnimatedSection index={0}>
            <AuthPremiumField
              variant="phone"
              label={t('otp.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('otp.phonePlaceholder')}
              editable={!loading}
            />
          </AuthAnimatedSection>
        ) : (
          <>
            <AuthAnimatedSection index={0}>
              <OtpInput
                value={code}
                onChange={setCode}
                error={Boolean(error)}
                disabled={loading}
                autoFocus
              />
            </AuthAnimatedSection>

            <AuthAnimatedSection index={1}>
              <View style={styles.consentBlock}>
                <ConsentRow checked={acceptedPolicy} onToggle={() => setAcceptedPolicy((v) => !v)}>
                  <Text style={styles.consentText}>
                    {t('otp.consentPolicyBefore')}{' '}
                    <Text style={styles.link} onPress={() => void Linking.openURL(PRIVACY_URL)}>
                      {t('otp.consentPrivacyLink')}
                    </Text>{' '}
                    {t('otp.consentPolicyAfter', { version: policyVersion })}
                  </Text>
                </ConsentRow>
                <ConsentRow checked={acceptedAi} onToggle={() => setAcceptedAi((v) => !v)}>
                  <Text style={styles.consentText}>{t('otp.consentAi')}</Text>
                </ConsentRow>
              </View>
            </AuthAnimatedSection>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 10,
  },
  countdown: {
    fontSize: 13,
    color: AUTH_UI.muted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  consentBlock: {
    gap: 12,
    marginTop: 8,
  },
  consentRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: AUTH_UI.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: AUTH_UI.accent,
    borderColor: AUTH_UI.accent,
  },
  consentCopy: {
    flex: 1,
  },
  consentText: {
    fontSize: 12,
    color: AUTH_UI.muted,
    lineHeight: 19,
  },
  link: {
    color: AUTH_UI.accent,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
  },
});
