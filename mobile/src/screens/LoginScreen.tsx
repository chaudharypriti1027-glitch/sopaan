import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthDivider,
  AuthErrorBanner,
  AuthFooterLink,
  AuthFormCard,
  AuthFormIntro,
  AuthPremiumField,
  AuthPremiumHero,
  AuthScreen,
  AuthTrustNote,
  LoginMethodTiles,
  LoginPerkStrip,
  PrimaryButton,
  useShakeOnError,
} from '../components/auth';
import { authApi, parseApiError } from '../api';
import { completeGoogleLogin } from '../auth/completeGoogleLogin';
import { completeStudentLogin, isAdminAppAccessError } from '../auth/studentSession';
import { useGoogleSignIn } from '../auth/useGoogleSignIn';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';

type LoginNav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'Login'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<LoginNav>();
  const styles = useMemo(() => createStyles(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const { signInWithGoogle, loading: googleLoading, isConfigured: googleConfigured } =
    useGoogleSignIn();

  const shakeStyle = useShakeOnError(formError);
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= 8;
  const busy = loginLoading || googleLoading;
  const canEmailLogin = emailValid && passwordValid && !busy;

  const validateEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t('login.emailRequired'));
      return false;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError(t('login.emailInvalid'));
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError(t('login.passwordMin'));
      return false;
    }
    setPasswordError(undefined);
    return true;
  };

  const handlePasswordLogin = async () => {
    setFormError(null);
    setPasswordError(undefined);

    if (!validateEmail() || !validatePassword()) {
      setFormError(t('login.checkEmailPassword'));
      return;
    }

    setLoginLoading(true);
    try {
      const result = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      const ok = await completeStudentLogin(navigation, result);
      if (!ok) {
        setFormError(t('login.adminUseWebConsole'));
        return;
      }
    } catch (err) {
      if (isAdminAppAccessError(err)) {
        setFormError(t('login.adminUseWebConsole'));
        return;
      }
      const parsed = parseApiError(err);
      setFormError(
        parsed.code === 'INVALID_CREDENTIALS'
          ? t('login.checkEmailPassword')
          : parsed.message,
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);

    if (!googleConfigured) {
      setFormError(t('signup.comingSoonMessage'));
      return;
    }

    await completeGoogleLogin(
      navigation as Parameters<typeof completeGoogleLogin>[0],
      signInWithGoogle,
      {
        onError: setFormError,
      },
    );
  };

  return (
    <AuthScreen scrollProps={{ keyboardShouldPersistTaps: 'handled' }}>
      <AuthPremiumHero variant="login" />

      <Animated.View entering={FadeInDown.duration(440).delay(80)} style={shakeStyle}>
        <AuthFormCard overlap premium>
          <AuthFormIntro
            eyebrow={t('login.formEyebrow')}
            title={t('login.emailTitle')}
            subtitle={t('login.emailSubtitle')}
          />

          <LoginPerkStrip />

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
              editable={!busy}
              testID="login-email"
            />
          </AuthAnimatedSection>

          <AuthAnimatedSection index={1}>
            <AuthPremiumField
              dense
              variant="password"
              label={t('login.password')}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(undefined);
                if (formError) setFormError(null);
              }}
              placeholder={t('login.passwordPlaceholder')}
              error={passwordError}
              editable={!busy}
              testID="login-password"
            />
          </AuthAnimatedSection>

          {formError ? (
            <AuthErrorBanner message={formError} testID="login-form-error" />
          ) : null}

          <AuthAnimatedSection index={2}>
            <PrimaryButton
              label={t('login.submit')}
              loading={loginLoading}
              disabled={!canEmailLogin}
              onPress={handlePasswordLogin}
              style={styles.submitBtn}
            />
          </AuthAnimatedSection>

          <AuthDivider label={t('login.dividerOr')} />

          <AuthAnimatedSection index={3}>
            <LoginMethodTiles
              onGooglePress={() => void handleGoogleSignIn()}
              onPhonePress={() => navigation.navigate('OtpLogin')}
              googleDisabled={busy}
              phoneDisabled={busy}
            />
          </AuthAnimatedSection>
        </AuthFormCard>

        <View style={styles.footer}>
          <AuthFooterLink
            muted={t('login.newHere')}
            strong={t('login.signupLink')}
            onPress={() => navigation.navigate('Signup')}
            testID="login-signup-link"
            accessibilityLabel={t('login.createAccountA11y')}
          />
          <AuthTrustNote message={t('brand.secureNote')} testID="login-trust-note" />
        </View>
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    submitBtn: {
      marginTop: 4,
    },
    footer: {
      gap: 12,
      alignItems: 'center',
      marginTop: 4,
    },
  });
}
