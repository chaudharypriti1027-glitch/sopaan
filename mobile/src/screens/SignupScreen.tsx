import { useEffect, useMemo, useState } from 'react';
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
  PrimaryButton,
  VerifiedPhoneChip,
  useShakeOnError,
} from '../components/auth';
import { Text } from '../components/Text';
import { meApi, parseApiError } from '../api';
import {
  DEFAULT_PLACEHOLDER_NAME,
  needsPostOtpProfileCompletion,
} from '../auth/signupFlow';
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
      <Animated.View style={shakeStyle}>
        <AuthFormCard>
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
        </AuthFormCard>
      </Animated.View>
    </AuthScreen>
  );
}

/** Guests sign up via phone OTP — redirect if this screen is opened without a session. */
function SignupGuestRedirect() {
  const navigation = useNavigation<SignupNav>();

  useEffect(() => {
    navigation.replace('OtpLogin');
  }, [navigation]);

  return null;
}

export function SignupScreen() {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === 'authed' && needsPostOtpProfileCompletion(profile)) {
    return <SignupProfileCompletion />;
  }

  return <SignupGuestRedirect />;
}

function createCompletionStyles() {
  return StyleSheet.create({
    formError: {
      fontSize: 12,
      color: '#C4634F',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
  });
}
