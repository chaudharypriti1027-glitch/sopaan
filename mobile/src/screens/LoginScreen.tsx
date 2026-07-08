import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthFormCard,
  AuthPremiumField,
  AuthScreen,
  GhostButton,
  PrimaryButton,
  useShakeOnError,
} from '../components/auth';
import { Text } from '../components/Text';
import { authApi, parseApiError } from '../api';
import { completeStudentLogin, isAdminAppAccessError } from '../auth/studentSession';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';
import { AUTH_UI } from '../components/auth/authTheme';

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

  const shakeStyle = useShakeOnError(formError);
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= 8;
  const canEmailLogin = emailValid && passwordValid && !loginLoading;

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

  return (
    <AuthScreen
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
      header={
        <AuthBrandHeader title={t('login.emailTitle')} subtitle={t('login.emailSubtitle')} />
      }
      footer={
        <GhostButton
          label={t('login.usePhoneInstead')}
          disabled={loginLoading}
          onPress={() => navigation.navigate('OtpLogin')}
          testID="login-use-phone"
        />
      }
    >
      <Animated.View style={shakeStyle}>
        <AuthFormCard>
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
              editable={!loginLoading}
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
              editable={!loginLoading}
              testID="login-password"
            />
          </AuthAnimatedSection>

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <PrimaryButton
            label={t('login.submit')}
            loading={loginLoading}
            disabled={!canEmailLogin}
            onPress={handlePasswordLogin}
            style={styles.submitBtn}
          />
        </AuthFormCard>
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    formError: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginBottom: 8,
    },
    submitBtn: {
      marginTop: 4,
    },
  });
}
