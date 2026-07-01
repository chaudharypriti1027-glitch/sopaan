import { useMemo, useState, useEffect } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthDivider,
  AuthPremiumField,
  AuthScreen,
  AuthSocialPair,
  PrimaryButton,
  useShakeOnError,
} from '../components/auth';
import { Text } from '../components/Text';
import { authApi, parseApiError, privacyApi } from '../api';
import { normalizeAuthResult } from '../auth/normalizeAuthResult';
import { routeAfterSession } from '../auth/routeAfterSession';
import { useGoogleSignIn } from '../auth/useGoogleSignIn';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/auth';
import { AUTH_UI } from '../components/auth/authTheme';

type LoginNav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'Login'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const TERMS_URL = 'https://sopaan.app/terms';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<LoginNav>();
  const setSession = useAuthStore((state) => state.setSession);
  const styles = useMemo(() => createStyles(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [policyVersion, setPolicyVersion] = useState('2025-06-01');
  const { signInWithGoogle, loading: googleLoading, isConfigured: isGoogleConfigured } =
    useGoogleSignIn();

  useEffect(() => {
    void privacyApi.getPolicy().then((policy) => setPolicyVersion(policy.version)).catch(() => {});
  }, []);

  const shakeStyle = useShakeOnError(formError);
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= 8;
  const isBusy = loginLoading || googleLoading;
  const canEmailLogin = emailValid && passwordValid && !isBusy;

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
      await setSession(normalizeAuthResult(result));
      routeAfterSession(navigation, useAuthStore.getState().profile);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);

    try {
      const result = await signInWithGoogle({
        privacyConsent: {
          policyVersion,
          aiProcessing: true,
          marketing: false,
        },
      });
      await setSession(normalizeAuthResult(result));
      routeAfterSession(navigation, useAuthStore.getState().profile);
    } catch (err) {
      setFormError(parseApiError(err).message);
    }
  };

  const handlePhonePress = () => {
    navigation.navigate('OtpLogin');
  };

  const handleForgotPassword = () => {
    Alert.alert(t('login.forgotPassword'), t('login.forgotPasswordBody'));
  };

  return (
    <AuthScreen
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
      header={
        <AuthBrandHeader title={t('login.brandTitle')} subtitle={t('login.brandSubtitle')} />
      }
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={t('login.submit')}
            loading={loginLoading}
            disabled={!canEmailLogin}
            onPress={handlePasswordLogin}
          />

          <AuthDivider label={t('login.dividerOr')} />

          <AuthSocialPair
            googleLabel="Google"
            otpLabel={t('login.phone')}
            googleDisabled={!isGoogleConfigured || isBusy}
            onGooglePress={() => void handleGoogleSignIn()}
            onOtpPress={handlePhonePress}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('login.createAccountA11y')}
            onPress={() => navigation.navigate('Signup')}
            style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
            testID="login-create-account"
          >
            <Text style={styles.footerMuted}>{t('login.signupPrompt')} </Text>
            <Text style={styles.footerStrong}>{t('login.signupLink')}</Text>
          </Pressable>

          <Text style={styles.tiny}>
            {t('login.termsPrefix')}{' '}
            <Text style={styles.tinyLink} onPress={() => void Linking.openURL(TERMS_URL)}>
              {t('login.termsLink')}
            </Text>
          </Text>
        </View>
      }
    >
      <Animated.View style={shakeStyle}>
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
            editable={!isBusy}
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
            editable={!isBusy}
            testID="login-password"
          />
        </AuthAnimatedSection>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('login.forgotPassword')}
          onPress={handleForgotPassword}
          style={styles.forgotWrap}
          testID="login-forgot-password"
        >
          <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
        </Pressable>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    footer: {
      gap: 0,
    },
    footerLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      minHeight: 44,
    },
    pressed: { opacity: 0.88 },
    footerMuted: {
      fontSize: 12,
      color: AUTH_UI.muted,
    },
    footerStrong: {
      fontSize: 12,
      fontWeight: '700',
      color: AUTH_UI.accent,
    },
    tiny: {
      fontSize: 10,
      color: AUTH_UI.faint,
      textAlign: 'center',
      marginTop: 10,
    },
    tinyLink: {
      fontSize: 10,
      color: AUTH_UI.accent,
      fontWeight: '600',
    },
    formError: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginTop: 8,
    },
    forgotWrap: {
      alignSelf: 'flex-end',
      marginTop: -4,
      marginBottom: 4,
      minHeight: 32,
      justifyContent: 'center',
    },
    forgotText: {
      fontSize: 12,
      fontWeight: '700',
      color: AUTH_UI.goldDeep,
    },
  });
}
