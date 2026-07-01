import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Clock3 } from 'lucide-react-native';
import {
  AUTH_UI,
  AuthAnimatedSection,
  AuthBrandHeader,
  AuthDivider,
  AuthPremiumField,
  AuthScreen,
  AuthSocialButton,
  AuthTermsBox,
  PasswordRequirements,
  PrimaryButton,
  VerifiedPhoneChip,
  useShakeOnError,
} from '../components/auth';
import { Text } from '../components/Text';
import { meApi, parseApiError, privacyApi } from '../api';
import { useAuth } from '../auth';
import { normalizeAuthResult } from '../auth/normalizeAuthResult';
import { routeAfterSession } from '../auth/routeAfterSession';
import { useGoogleSignIn } from '../auth/useGoogleSignIn';
import { useOnboarding } from '../auth/OnboardingContext';
import { isStrongPassword } from '../lib/passwordPolicy';
import type { AuthStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/auth';

type SignupNav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const DEFAULT_PLACEHOLDER_NAME = 'Student';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialName(name: string | undefined) {
  const trimmed = name?.trim() ?? '';
  return trimmed === DEFAULT_PLACEHOLDER_NAME ? '' : trimmed;
}

/** Post-OTP name/email collection for authenticated new users. */
function SignupProfileCompletion() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<SignupNav>();
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const styles = useMemo(() => createCompletionStyles(), []);

  const [name, setName] = useState(() => initialName(profile?.name));
  const [email, setEmail] = useState(profile?.email ?? '');
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shakeStyle = useShakeOnError(formError);
  const phone = profile?.phone ?? '';
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailValid = !trimmedEmail || EMAIL_PATTERN.test(trimmedEmail);
  const canContinue = trimmedName.length > 0 && emailValid && Boolean(phone) && !loading;

  const handleContinue = async () => {
    setFormError(null);
    setNameError(undefined);
    setEmailError(undefined);

    if (!trimmedName) {
      setNameError(t('signup.nameRequired'));
      setFormError(t('signup.nameRequiredBody'));
      return;
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError(t('signup.emailInvalidBody'));
      setFormError(t('signup.emailCheckBody'));
      return;
    }

    setLoading(true);
    try {
      const updated = await meApi.updateMe({
        name: trimmedName,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      });
      await setProfile(updated);
      navigation.navigate('ProfileSetup');
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      header={
        <AuthBrandHeader title={t('signup.postOtpTitle')} subtitle={t('signup.postOtpSubtitle')} />
      }
      footer={
        <PrimaryButton
          label={t('onboarding.continue')}
          loading={loading}
          disabled={!canContinue}
          onPress={handleContinue}
          testID="signup-continue"
        />
      }
    >
      <Animated.View style={[styles.form, shakeStyle]}>
        {phone ? (
          <AuthAnimatedSection index={0}>
            <VerifiedPhoneChip phone={phone} />
          </AuthAnimatedSection>
        ) : null}

        <AuthAnimatedSection index={1}>
          <AuthPremiumField
            dense
            label={t('signup.name')}
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (nameError) {
                setNameError(undefined);
              }
              if (formError) {
                setFormError(null);
              }
            }}
            error={nameError}
            autoCapitalize="words"
            editable={!loading}
            testID="signup-name"
          />
        </AuthAnimatedSection>

        <AuthAnimatedSection index={2}>
          <AuthPremiumField
            dense
            variant="email"
            label={t('signup.emailOptional')}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (emailError) {
                setEmailError(undefined);
              }
              if (formError) {
                setFormError(null);
              }
            }}
            error={emailError}
            autoCapitalize="none"
            editable={!loading}
            testID="signup-email"
          />
        </AuthAnimatedSection>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      </Animated.View>
    </AuthScreen>
  );
}

/** Email/password and social registration for guests. */
function SignupRegistration() {
  const navigation = useNavigation<SignupNav>();
  const { signup } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createRegistrationStyles(), []);
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyVersion, setPolicyVersion] = useState('2025-06-01');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { signInWithGoogle, loading: googleLoading, isConfigured: isGoogleConfigured } =
    useGoogleSignIn();

  useEffect(() => {
    void privacyApi.getPolicy().then((policy) => setPolicyVersion(policy.version)).catch(() => {});
  }, []);

  const passwordStrong = isStrongPassword(password);
  const emailValid = EMAIL_PATTERN.test(email.trim());

  const canSubmit =
    name.trim().length > 0 && emailValid && passwordStrong && acceptedTerms;

  const handleSignUp = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        privacyConsent: {
          policyVersion,
          aiProcessing: true,
          marketing: false,
        },
      });
      await completeOnboarding();
    } catch (err) {
      const message = parseApiError(err).message;
      setError(message);
      Alert.alert(t('signup.failedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!acceptedTerms) {
      Alert.alert(t('signup.failedTitle'), t('signup.termsRequired', 'Accept the terms to continue.'));
      return;
    }

    setError(null);
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
      const message = parseApiError(err).message;
      setError(message);
      Alert.alert(t('signup.failedTitle'), message);
    }
  };

  return (
    <AuthScreen
      header={<AuthBrandHeader title={t('signup.title')} subtitle={t('signup.subtitle')} />}
      footer={
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
          <Text style={styles.footerMuted}>{t('signup.loginPrompt')} </Text>
          <Text style={styles.footerStrong}>{t('signup.loginLink')}</Text>
        </Pressable>
      }
    >
      <AuthPremiumField
        dense
        label={t('signup.name')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        placeholder={t('signup.namePlaceholder')}
        testID="signup-name-field"
      />
      <AuthPremiumField
        dense
        variant="email"
        label={t('signup.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder={t('signup.emailPlaceholder')}
        testID="signup-email-field"
      />
      <AuthPremiumField
        dense
        variant="password"
        label={t('signup.password')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('signup.passwordHint')}
        testID="signup-password-field"
      />
      <PasswordRequirements password={password} />

      <AuthTermsBox
        testID="consent-policy"
        checked={acceptedTerms}
        onToggle={() => setAcceptedTerms((v) => !v)}
        policyVersion={policyVersion}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        label={t('signup.submit')}
        testID="signup-create-account"
        loading={loading}
        disabled={!canSubmit}
        onPress={handleSignUp}
      />

      <AuthDivider label={t('signup.orContinueWith')} />

      <AuthSocialButton
        label="Google"
        variant="google"
        disabled={!isGoogleConfigured || loading || googleLoading}
        onPress={() => void handleGoogleSignIn()}
      />

      <View style={styles.otpNote}>
        <Clock3 size={12} color={AUTH_UI.faint} strokeWidth={2} />
        <Text style={styles.otpNoteText}>{t('beta.otpNote')}</Text>
      </View>
    </AuthScreen>
  );
}

export function SignupScreen() {
  const status = useAuthStore((state) => state.status);

  if (status === 'authed') {
    return <SignupProfileCompletion />;
  }

  return <SignupRegistration />;
}

function createCompletionStyles() {
  return StyleSheet.create({
    form: {
      gap: 4,
    },
    formError: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginTop: 8,
    },
  });
}

function createRegistrationStyles() {
  return StyleSheet.create({
    footerLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 44,
      alignItems: 'center',
    },
    footerMuted: {
      fontSize: 12,
      color: AUTH_UI.muted,
    },
    footerStrong: {
      fontSize: 12,
      fontWeight: '700',
      color: AUTH_UI.accent,
    },
    error: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginBottom: 8,
    },
    otpNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      marginTop: 16,
    },
    otpNoteText: {
      fontSize: 11,
      color: AUTH_UI.faint,
      fontWeight: '500',
    },
  });
}
