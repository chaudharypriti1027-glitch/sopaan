import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthDivider,
  AuthFormCard,
  AuthFormIntro,
  AuthPremiumField,
  AuthPremiumHero,
  AuthScreen,
  AuthSocialButton,
  AuthTermsBox,
  AuthTrustNote,
  GhostButton,
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
import { Text } from '../../components';
import { authApi, parseApiError, privacyApi } from '../../api';
import type { SignupInput } from '../../api/auth';
import { completeGoogleLogin } from '../../auth/completeGoogleLogin';
import { formatOtpError } from '../../auth/otpErrors';
import { useGoogleSignIn } from '../../auth/useGoogleSignIn';
import { formatIndianPhone, isValidIndianMobile } from '../../lib/phone';
import type { AuthStackParamList } from '../../navigation/types';

type OtpLoginNav = NativeStackNavigationProp<AuthStackParamList, 'OtpLogin'>;

export function OtpLoginScreen() {
  const navigation = useNavigation<OtpLoginNav>();
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);
  const { signInWithGoogle, loading: googleLoading, isConfigured: googleConfigured } =
    useGoogleSignIn();

  const [digits, setDigits] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [policyVersion, setPolicyVersion] = useState('2025-06-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void privacyApi.getPolicy().then((policy) => setPolicyVersion(policy.version)).catch(() => {});
  }, []);

  const shakeStyle = useShakeOnError(error);
  const phoneValid = isValidIndianMobile(digits);
  const busy = loading || googleLoading;
  const canSubmit = phoneValid && acceptedTerms && !busy;

  const privacyConsent = useMemo(
    () =>
      ({
        policyVersion,
        aiProcessing: true,
        marketing: false,
      }) satisfies NonNullable<SignupInput['privacyConsent']>,
    [policyVersion],
  );

  const handleSendOtp = async () => {
    setError(null);

    if (!phoneValid) {
      setError(t('otp.invalidPhone'));
      return;
    }

    if (!acceptedTerms) {
      setError(t('otp.consentRequired'));
      return;
    }

    setLoading(true);

    try {
      const phone = formatIndianPhone(digits);
      await authApi.requestOtp({ phone });
      navigation.navigate('Otp', {
        phone,
        privacyConsent,
      });
    } catch (err) {
      setError(formatOtpError(parseApiError(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);

    if (!acceptedTerms) {
      setError(t('otp.consentRequired'));
      return;
    }

    if (!googleConfigured) {
      setError(t('signup.comingSoonMessage'));
      return;
    }

    await completeGoogleLogin(
      navigation as Parameters<typeof completeGoogleLogin>[0],
      signInWithGoogle,
      {
        privacyConsent,
        onError: setError,
      },
    );
  };

  return (
    <AuthScreen scrollProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <AuthPremiumHero variant="otp" />

      <Animated.View entering={FadeInDown.duration(440).delay(80)} style={shakeStyle}>
        <AuthFormCard overlap>
          <AuthFormIntro
            eyebrow={t('otp.formEyebrow')}
            title={t('otp.entryTitle')}
            subtitle={t('otp.entrySubtitle')}
          />

          <AuthAnimatedSection index={0}>
            <AuthPremiumField
              dense
              variant="phone"
              label={t('otp.phone')}
              value={digits}
              placeholder={t('otp.phonePlaceholder')}
              onChangeText={(value) => {
                setDigits(value);
                if (error) setError(null);
              }}
              editable={!busy}
              testID="otp-login-phone"
              autoFocus
            />
          </AuthAnimatedSection>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AuthTermsBox
            testID="otp-login-consent"
            checked={acceptedTerms}
            onToggle={() => setAcceptedTerms((v) => !v)}
            policyVersion={policyVersion}
          />

          <PrimaryButton
            label={t('otp.continue')}
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void handleSendOtp()}
            testID="otp-login-send"
          />

          <AuthDivider label={t('login.dividerOr')} />

          <AuthSocialButton
            label={t('login.continueGoogle')}
            variant="google"
            disabled={busy || !acceptedTerms}
            onPress={() => void handleGoogleSignIn()}
            testID="otp-login-google"
          />

          <GhostButton
            label={t('otp.useEmailInstead')}
            disabled={busy}
            onPress={() => navigation.navigate('Login')}
            testID="otp-login-email-link"
          />
        </AuthFormCard>

        <AuthTrustNote message={t('brand.secureNote')} testID="otp-login-trust-note" />
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    error: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginTop: 2,
      marginBottom: 8,
      fontWeight: '600',
    },
  });
}
