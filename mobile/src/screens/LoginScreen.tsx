import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
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
  const reducedMotion = useReducedMotion();
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
          disabled={busy}
          onPress={() => navigation.navigate('Welcome')}
          testID="login-back"
        />

        <AuthFlowHeader
          title={t('login.emailTitle')}
          subtitle={t('login.emailSubtitle')}
          testID="login-header"
        />

        <Animated.View entering={enterForm} style={[styles.form, shakeStyle]}>
          <AuthPremiumField
            dark
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
            editable={!loginLoading}
            testID="login-email"
          />

          <AuthPremiumField
            dark
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
            editable={!loginLoading}
            testID="login-password"
          />

          {formError ? (
            <AuthErrorBanner dark message={formError} testID="login-form-error" />
          ) : null}

          <PrimaryButton
            label={t('login.submit')}
            loading={loginLoading}
            disabled={!canEmailLogin}
            onPress={handlePasswordLogin}
            testID="login-submit"
            trailingIcon={ArrowRight}
          />

          <AuthDivider dark label={t('login.dividerOr')} />

          <AuthSocialButton
            dark
            label={t('login.continueGoogle')}
            variant="google"
            disabled={busy}
            onPress={() => void handleGoogleSignIn()}
            testID="login-google"
          />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={enterFooter}>
          <AuthAltLinks
            dark
            links={[
              {
                label: t('login.usePhoneInstead'),
                onPress: busy ? undefined : () => navigation.navigate('OtpLogin'),
                testID: 'login-use-phone',
              },
              {
                label: t('login.forgotPassword'),
                onPress: busy
                  ? undefined
                  : () =>
                      navigation.navigate('ForgotPassword', {
                        email: email.trim() || undefined,
                      }),
                testID: 'login-forgot-password',
                accessibilityLabel: t('login.forgotPassword'),
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
