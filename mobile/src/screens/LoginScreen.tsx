import { useMemo, useState, useEffect } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
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
  AuthSocialButton,
  AuthTabSwitcher,
  GhostButton,
  PrimaryButton,
  useShakeOnError,
} from '../components/auth';
import { Text } from '../components/Text';
import { authApi, parseApiError, privacyApi } from '../api';
import { normalizeAuthResult } from '../auth/normalizeAuthResult';
import { routeAfterSession } from '../auth/routeAfterSession';
import { useGoogleSignIn } from '../auth/useGoogleSignIn';
import { formatIndianPhone, isValidIndianMobile } from '../lib/phone';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/auth';
import { AUTH_UI } from '../components/auth/authTheme';

type LoginNav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'Login'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type LoginMethod = 'phone' | 'email';

const TERMS_URL = 'https://sopaan.app/terms';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<LoginNav>();
  const setSession = useAuthStore((state) => state.setSession);
  const styles = useMemo(() => createStyles(), []);

  const loginMethodOptions = useMemo(
    () => [
      { key: 'email' as const, label: t('login.email') },
      { key: 'phone' as const, label: t('login.phone') },
    ],
    [t],
  );

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordMode, setShowPasswordMode] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
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
  const phoneValid = isValidIndianMobile(phone);
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= 8;
  const isBusy = otpLoading || loginLoading || googleLoading;

  const canSendOtp = loginMethod === 'phone' && !showPasswordMode && phoneValid && !isBusy;
  const canPhoneLogin = loginMethod === 'phone' && showPasswordMode && phoneValid && passwordValid && !isBusy;
  const canEmailLogin = loginMethod === 'email' && emailValid && passwordValid && !isBusy;

  const switchLoginMethod = (method: LoginMethod) => {
    setLoginMethod(method);
    setFormError(null);
    setPhoneError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setShowPasswordMode(false);
    setPassword('');
  };

  const validatePhone = () => {
    if (!phone) {
      setPhoneError(t('login.phoneRequired'));
      return false;
    }
    if (!isValidIndianMobile(phone)) {
      setPhoneError(t('login.phoneInvalid'));
      return false;
    }
    setPhoneError(undefined);
    return true;
  };

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

  const handleSendOtp = async () => {
    setFormError(null);
    if (!validatePhone()) {
      setFormError(t('login.checkPhone'));
      return;
    }

    setOtpLoading(true);
    try {
      const formattedPhone = formatIndianPhone(phone);
      await authApi.requestOtp({ phone: formattedPhone });
      navigation.navigate('Otp', { phone: formattedPhone });
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setFormError(null);
    setPasswordError(undefined);

    if (loginMethod === 'phone') {
      if (!validatePhone() || !validatePassword()) {
        setFormError(t('login.checkPhonePassword'));
        return;
      }
    } else if (!validateEmail() || !validatePassword()) {
      setFormError(t('login.checkEmailPassword'));
      return;
    }

    setLoginLoading(true);
    try {
      const result = await authApi.login(
        loginMethod === 'phone'
          ? { phone: formatIndianPhone(phone), password }
          : { email: email.trim().toLowerCase(), password },
      );
      await setSession(normalizeAuthResult(result));
      routeAfterSession(navigation, useAuthStore.getState().profile);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setLoginLoading(false);
    }
  };

  const togglePasswordMode = () => {
    setFormError(null);
    setPasswordError(undefined);
    setShowPasswordMode((value) => !value);
    if (showPasswordMode) {
      setPassword('');
    }
  };

  const showPhonePassword = loginMethod === 'phone' && showPasswordMode;
  const showEmailPassword = loginMethod === 'email';

  const primaryLabel =
    loginMethod === 'phone' && !showPasswordMode ? t('login.sendOtp') : t('login.submit');

  const primaryAction =
    loginMethod === 'phone' && !showPasswordMode ? handleSendOtp : handlePasswordLogin;

  const primaryDisabled =
    loginMethod === 'phone' && !showPasswordMode
      ? !canSendOtp
      : !(canPhoneLogin || canEmailLogin);

  const primaryLoading =
    loginMethod === 'phone' && !showPasswordMode ? otpLoading : loginLoading;

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

  return (
    <AuthScreen
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
      header={
        <AuthBrandHeader title={t('login.brandTitle')} subtitle={t('login.brandSubtitle')} />
      }
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={primaryLabel}
            loading={primaryLoading}
            disabled={primaryDisabled}
            onPress={primaryAction}
          />

          {loginMethod === 'phone' ? (
            <GhostButton
              label={showPasswordMode ? t('login.useOtpInstead') : t('login.usePasswordInstead')}
              disabled={isBusy}
              onPress={togglePasswordMode}
            />
          ) : null}

          <AuthDivider label={t('login.dividerOr')} />

          <AuthSocialButton
            label={t('login.continueGoogle')}
            variant="google"
            disabled={!isGoogleConfigured || isBusy}
            onPress={() => void handleGoogleSignIn()}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('login.createAccountA11y')}
            onPress={() => navigation.navigate('Signup')}
            style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
            testID="login-create-account"
          >
            <Text style={styles.footerMuted}>{t('login.newHere')} </Text>
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
          <AuthTabSwitcher
            options={loginMethodOptions}
            value={loginMethod}
            onChange={switchLoginMethod}
          />
        </AuthAnimatedSection>

        {loginMethod === 'phone' ? (
          <AuthAnimatedSection index={1}>
            <AuthPremiumField
              variant="phone"
              label={t('login.phoneNumber')}
              value={phone}
              placeholder={t('login.phoneNumber')}
              onChangeText={(value) => {
                setPhone(value);
                if (phoneError) setPhoneError(undefined);
                if (formError) setFormError(null);
              }}
              error={phoneError}
              editable={!isBusy}
              testID="login-phone"
            />
          </AuthAnimatedSection>
        ) : (
          <AuthAnimatedSection index={1}>
            <AuthPremiumField
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
        )}

        {showPhonePassword || showEmailPassword ? (
          <AuthAnimatedSection index={2}>
            <AuthPremiumField
              variant="password"
              label={t('login.password')}
              value={password}
              placeholder={t('login.passwordPlaceholder')}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(undefined);
                if (formError) setFormError(null);
              }}
              error={passwordError}
              editable={!isBusy}
              testID="login-password"
            />
            {loginMethod === 'email' ? (
              <Pressable style={styles.forgotWrap}>
                <Text style={styles.forgot}>{t('login.forgotPassword')}</Text>
              </Pressable>
            ) : null}
          </AuthAnimatedSection>
        ) : null}

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
      color: '#818CF8',
      fontWeight: '600',
    },
    forgotWrap: {
      alignSelf: 'flex-end',
      marginTop: -6,
      marginBottom: 4,
    },
    forgot: {
      fontSize: 11,
      fontWeight: '600',
      color: AUTH_UI.accent,
    },
    formError: {
      fontSize: 12,
      color: '#EF4444',
      textAlign: 'center',
      marginTop: 8,
    },
  });
}
