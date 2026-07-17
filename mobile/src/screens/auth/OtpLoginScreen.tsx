import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import {
  AuthAltLinks,
  AuthBackButton,
  AuthDivider,
  AuthErrorBanner,
  AuthFlowHeader,
  AuthPremiumField,
  AuthScreen,
  AuthSocialButton,
  AuthTermsBox,
  PrimaryButton,
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
  const reducedMotion = useReducedMotion();
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

  const enterFooter = reducedMotion
    ? undefined
    : FadeInDown.duration(380).delay(240).reduceMotion(ReduceMotion.System);

  return (
    <AuthScreen
      scrollProps={{ keyboardShouldPersistTaps: 'always' }}
      fill
      ambient={false}
    >
      <View style={styles.column}>
        <AuthBackButton
          disabled={busy}
          onPress={() => navigation.navigate('Welcome')}
          testID="otp-login-back"
        />

        <AuthFlowHeader
          title={t('otp.entryTitle')}
          subtitle={t('otp.entrySubtitle')}
          testID="otp-login-header"
        />

        <View style={styles.form}>
          <AuthPremiumField
            dark
            variant="phone"
            label={t('otp.phone')}
            value={digits}
            placeholder={t('otp.phonePlaceholder')}
            onChangeText={(value) => {
              setDigits(value);
              if (error) setError(null);
            }}
            editable={!loading}
            testID="otp-login-phone"
            autoFocus
          />

          <AuthTermsBox
            dark
            testID="otp-login-consent"
            checked={acceptedTerms}
            onToggle={() => setAcceptedTerms((v) => !v)}
            policyVersion={policyVersion}
          />

          {error ? (
            <AuthErrorBanner dark message={error} testID="otp-login-error" />
          ) : null}

          <PrimaryButton
            label={t('otp.continue')}
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void handleSendOtp()}
            testID="otp-login-send"
            trailingIcon={ArrowRight}
          />

          <AuthDivider dark label={t('login.dividerOr')} />

          <AuthSocialButton
            dark
            label={t('login.continueGoogle')}
            variant="google"
            disabled={busy || !acceptedTerms}
            onPress={() => void handleGoogleSignIn()}
            testID="otp-login-google"
          />
        </View>

        <View style={styles.spacer} />

        <Animated.View entering={enterFooter}>
          <AuthAltLinks
            dark
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
        </Animated.View>
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
      marginTop: 34,
      gap: 16,
    },
    spacer: {
      flex: 1,
      minHeight: 20,
    },
  });
}
