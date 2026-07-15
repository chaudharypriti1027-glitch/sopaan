import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import {
  AuthDivider,
  AuthErrorBanner,
  AuthAltLinks,
  AuthFormCard,
  AuthFormIntro,
  AuthPremiumField,
  AuthPremiumHero,
  AuthScreen,
  AuthSocialButton,
  AuthTermsBox,
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
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
      <AuthPremiumHero variant="otp" compact />

      <Animated.View entering={FadeInDown.duration(400).delay(80)} style={shakeStyle}>
        <AuthFormCard overlap premium borderless>
          <View style={styles.formStack}>
            <AuthFormIntro
              title={t('otp.entryTitle')}
              subtitle={t('otp.entrySubtitle')}
              accent
              compactSpacing
            />

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

            {error ? (
              <AuthErrorBanner message={error} testID="otp-login-error" />
            ) : null}

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
              trailingIcon={ArrowRight}
            />
          </View>

          <AuthDivider label={t('login.dividerOr')} />

          <View style={styles.altMethods}>
            <AuthSocialButton
              label={t('login.continueGoogle')}
              variant="google"
              style={styles.socialButton}
              disabled={busy || !acceptedTerms}
              onPress={() => void handleGoogleSignIn()}
              testID="otp-login-google"
            />
            <AuthAltLinks
              links={[
                {
                  label: t('otp.useEmailInstead'),
                  onPress: busy ? undefined : () => navigation.navigate('Login'),
                  testID: 'otp-login-email-link',
                },
                {
                  label: t('otp.cantSignIn'),
                  onPress: busy ? undefined : () => navigation.navigate('ForgotPassword'),
                  testID: 'otp-login-cant-sign-in',
                },
              ]}
            />
          </View>
        </AuthFormCard>
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    formStack: {
      gap: 14,
    },
    altMethods: {
      gap: 14,
    },
    socialButton: {
      borderWidth: 0,
      backgroundColor: '#F7F4EC',
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}
