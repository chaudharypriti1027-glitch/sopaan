import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthAltLinks,
  AuthDivider,
  AuthErrorBanner,
  AuthFooterLink,
  AuthFormCard,
  AuthFormIntro,
  AuthPremiumField,
  AuthPremiumHero,
  AuthScreen,
  AuthSocialButton,
  GhostButton,
  PrimaryButton,
  useShakeOnError,
} from '../components/auth';
import { authApi, parseApiError } from '../api';
import { completeGoogleLogin } from '../auth/completeGoogleLogin';
import { completeStudentLogin, isAdminAppAccessError } from '../auth/studentSession';
import { getUserFacingMessage } from '../errors/getUserFacingMessage';
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
          : getUserFacingMessage(err),
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

      <Animated.View entering={FadeInDown.duration(400).delay(80)} style={shakeStyle}>
        <AuthFormCard overlap premium>
          <AuthFormIntro
            title={t('login.emailTitle')}
            subtitle={t('login.emailSubtitle')}
          />

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

          <AuthAltLinks
            links={[
              {
                label: t('login.forgotPassword'),
                onPress: () =>
                  navigation.navigate('ForgotPassword', {
                    email: email.trim() || undefined,
                  }),
                testID: 'login-forgot-password',
                accessibilityLabel: t('login.forgotPassword'),
              },
            ]}
          />

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

          <View style={styles.altMethods}>
            <AuthSocialButton
              label={t('login.continueGoogle')}
              variant="google"
              disabled={busy}
              onPress={() => void handleGoogleSignIn()}
              testID="login-google"
            />
            <GhostButton
              label={t('login.usePhoneInstead')}
              disabled={busy}
              onPress={() => navigation.navigate('OtpLogin')}
              testID="login-use-phone"
            />
          </View>
        </AuthFormCard>

        <View style={styles.footer}>
          <AuthFooterLink
            muted={t('login.newHere')}
            strong={t('login.signupLink')}
            onPress={() => navigation.navigate('Signup')}
            testID="login-signup-link"
            accessibilityLabel={t('login.createAccountA11y')}
          />
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
    altMethods: {
      gap: 8,
    },
    footer: {
      gap: 12,
      alignItems: 'center',
      marginTop: 4,
    },
  });
}
