import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import {
  AuthAltLinks,
  AuthBackButton,
  AuthErrorBanner,
  AuthFlowHeader,
  AuthPremiumField,
  AuthScreen,
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
  const reducedMotion = useReducedMotion();
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

  const enterForm = reducedMotion
    ? undefined
    : FadeInDown.duration(420).delay(140).reduceMotion(ReduceMotion.System);
  const enterFooter = reducedMotion
    ? undefined
    : FadeInDown.duration(380).delay(240).reduceMotion(ReduceMotion.System);

  return (
    <AuthScreen scrollProps={{ keyboardShouldPersistTaps: 'handled' }} fill>
      <View style={styles.column}>
        <AuthBackButton disabled={loading} testID="forgot-back" />

        <AuthFlowHeader
          title={t('forgot.title')}
          subtitle={t('forgot.subtitle')}
          testID="forgot-header"
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
            editable={!loading}
            testID="forgot-email"
            autoFocus
          />

          {formError ? (
            <AuthErrorBanner dark message={formError} testID="forgot-form-error" />
          ) : null}

          <PrimaryButton
            label={t('forgot.sendCode')}
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            testID="forgot-submit"
            trailingIcon={ArrowRight}
          />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={enterFooter}>
          <AuthAltLinks
            dark
            links={[
              {
                label: t('forgot.backToLogin'),
                onPress: loading ? undefined : () => navigation.navigate('Login'),
                testID: 'forgot-back-login',
              },
              {
                label: t('forgot.usePhoneInstead'),
                onPress: loading ? undefined : () => navigation.navigate('OtpLogin'),
                testID: 'forgot-use-phone',
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
      minHeight: 520,
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
