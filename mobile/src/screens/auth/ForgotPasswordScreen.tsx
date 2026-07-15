import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
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
  PrimaryButton,
  useShakeOnError,
} from '../../components/auth';
import { authApi, parseApiError } from '../../api';
import { formatOtpError } from '../../auth/otpErrors';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type Route = RouteProp<AuthStackParamList, 'ForgotPassword'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const styles = useMemo(() => createStyles(), []);

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  const shakeStyle = useShakeOnError(formError);
  const canSubmit = EMAIL_PATTERN.test(email.trim()) && !loading;

  const handleSubmit = async () => {
    setFormError(null);
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setEmailError(t('login.emailRequired'));
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError(t('login.emailInvalid'));
      return;
    }
    setEmailError(undefined);
    setLoading(true);

    try {
      await authApi.forgotPassword({ email: trimmed });
      navigation.navigate('ResetPassword', { email: trimmed });
    } catch (err) {
      setFormError(formatOtpError(parseApiError(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen scrollProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <AuthPremiumHero variant="login" subtitle={t('forgot.heroSubtitle')} />

      <Animated.View entering={FadeInDown.duration(400).delay(80)} style={shakeStyle}>
        <AuthFormCard overlap premium>
          <AuthFormIntro title={t('forgot.title')} subtitle={t('forgot.subtitle')} />

          <AuthAnimatedSection index={0}>
            <AuthPremiumField
              dense
              variant="email"
              label={t('login.emailAddress')}
              value={email}
              placeholder={t('login.emailPlaceholder')}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(undefined);
                if (formError) setFormError(null);
              }}
              error={emailError}
              editable={!loading}
              testID="forgot-email"
              autoFocus
            />
          </AuthAnimatedSection>

          {formError ? (
            <AuthErrorBanner message={formError} testID="forgot-form-error" />
          ) : null}

          <AuthAnimatedSection index={1}>
            <PrimaryButton
              label={t('forgot.sendCode')}
              loading={loading}
              disabled={!canSubmit}
              onPress={() => void handleSubmit()}
              style={styles.submitBtn}
              testID="forgot-submit"
            />
          </AuthAnimatedSection>

          <View style={styles.alt}>
            <GhostButton
              label={t('forgot.backToLogin')}
              disabled={loading}
              onPress={() => navigation.navigate('Login')}
              testID="forgot-back-login"
            />
            <GhostButton
              label={t('forgot.usePhoneInstead')}
              disabled={loading}
              onPress={() => navigation.navigate('OtpLogin')}
              testID="forgot-use-phone"
            />
          </View>
        </AuthFormCard>
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    submitBtn: { marginTop: 4 },
    alt: { gap: 8, marginTop: 4 },
  });
}
