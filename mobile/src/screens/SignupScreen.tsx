import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react-native';
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
import { routeAfterSession } from '../auth/routeAfterSession';
import { completeStudentLogin, isAdminAppAccessError } from '../auth/studentSession';
import {
  DEFAULT_PLACEHOLDER_NAME,
  needsPostOtpProfileCompletion,
} from '../auth/signupFlow';
import { useGoogleSignIn } from '../auth/useGoogleSignIn';
import { isStrongPassword } from '../lib/passwordPolicy';
import type { AuthStackParamList, RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/auth';

type SignupNav = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList, 'Signup'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createRegistrationStyles(), []);

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
      routeAfterSession(navigation, useAuthStore.getState().profile);
    } catch (err) {
      if (isAdminAppAccessError(err)) {
        navigation.navigate('AdminPortal');
        return;
      }
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
      const ok = await completeStudentLogin(navigation, result);
      if (!ok) return;
    } catch (err) {
      if (isAdminAppAccessError(err)) {
        navigation.navigate('AdminPortal');
        return;
      }
      const message = parseApiError(err).message;
      setError(message);
      Alert.alert(t('signup.failedTitle'), message);
    }
  };

  return (
    <AuthScreen
      header={<AuthBrandHeader title={t('signup.title')} subtitle={t('signup.subtitle')} />}
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [styles.footerLink, pressed && styles.footerLinkPressed]}
          testID="signup-go-to-login"
        >
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
        label="Google" // i18n-ok: brand name, not translatable copy
        variant="google"
        disabled={!isGoogleConfigured || loading || googleLoading}
        onPress={() => void handleGoogleSignIn()}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('signup.continueWithOtp')}
        onPress={() => navigation.navigate('OtpLogin')}
        style={({ pressed }) => [styles.otpNote, pressed && styles.otpNotePressed]}
        testID="signup-continue-with-otp"
      >
        <View style={styles.otpNoteIcon}>
          <Smartphone size={13} color={AUTH_UI.sageDeep} strokeWidth={2.2} />
        </View>
        <Text style={styles.otpNoteText}>{t('signup.continueWithOtp')}</Text>
      </Pressable>
    </AuthScreen>
  );
}

export function SignupScreen() {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === 'authed' && needsPostOtpProfileCompletion(profile)) {
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
      alignSelf: 'center',
      minHeight: 46,
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 23,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1.5,
      borderColor: AUTH_UI.borderHover,
    },
    footerLinkPressed: {
      opacity: 0.75,
      backgroundColor: AUTH_UI.bg,
    },
    footerMuted: {
      fontSize: 13,
      color: AUTH_UI.label,
      fontWeight: '600',
    },
    footerStrong: {
      fontSize: 13,
      fontWeight: '800',
      color: AUTH_UI.accent,
      textDecorationLine: 'underline',
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
      alignSelf: 'center',
      gap: 8,
      marginTop: 18,
      minHeight: 36,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: AUTH_UI.card,
      borderWidth: 1,
      borderColor: AUTH_UI.border,
    },
    otpNotePressed: {
      opacity: 0.7,
      backgroundColor: AUTH_UI.bg,
    },
    otpNoteIcon: {
      width: 22,
      height: 22,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: AUTH_UI.sageSoft,
    },
    otpNoteText: {
      fontSize: 12,
      color: AUTH_UI.accent,
      fontWeight: '700',
    },
  });
}
