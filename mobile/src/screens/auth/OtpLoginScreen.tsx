import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthFormCard,
  AuthPremiumField,
  AuthScreen,
  AuthTermsBox,
  GhostButton,
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
import { Text } from '../../components';
import { authApi, parseApiError, privacyApi } from '../../api';
import { formatOtpError } from '../../auth/otpErrors';
import { formatIndianPhone, isValidIndianMobile } from '../../lib/phone';
import type { AuthStackParamList } from '../../navigation/types';

type OtpLoginNav = NativeStackNavigationProp<AuthStackParamList, 'OtpLogin'>;

export function OtpLoginScreen() {
  const navigation = useNavigation<OtpLoginNav>();
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

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
  const canSubmit = phoneValid && acceptedTerms && !loading;

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
        privacyConsent: {
          policyVersion,
          aiProcessing: true,
          marketing: false,
        },
      });
    } catch (err) {
      setError(formatOtpError(parseApiError(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
      header={
        <AuthBrandHeader title={t('otp.entryTitle')} subtitle={t('otp.entrySubtitle')} />
      }
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={t('otp.continue')}
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void handleSendOtp()}
            testID="otp-login-send"
          />
          <GhostButton
            label={t('otp.useEmailInstead')}
            disabled={loading}
            onPress={() => navigation.navigate('Login')}
            testID="otp-login-email-link"
          />
        </View>
      }
    >
      <Animated.View style={shakeStyle}>
        <AuthFormCard>
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
              editable={!loading}
              testID="otp-login-phone"
              autoFocus
            />
          </AuthAnimatedSection>

          <AuthTermsBox
            testID="otp-login-consent"
            checked={acceptedTerms}
            onToggle={() => setAcceptedTerms((v) => !v)}
            policyVersion={policyVersion}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </AuthFormCard>
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    footer: {
      gap: 10,
    },
    error: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginTop: 4,
    },
  });
}
