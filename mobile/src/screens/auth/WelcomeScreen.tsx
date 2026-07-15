import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthFormCard,
  AuthPremiumHero,
  AuthScreen,
  AuthTrustNote,
  GhostButton,
  PrimaryButton,
} from '../../components/auth';
import type { AuthStackParamList } from '../../navigation/types';

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<WelcomeNav>();
  const styles = useMemo(() => createStyles(), []);

  return (
    <AuthScreen scrollProps={{ bounces: false }}>
      <AuthPremiumHero variant="welcome" />

      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <AuthFormCard overlap>
          <View style={styles.cta}>
            <PrimaryButton
              label={t('welcome.getStarted')}
              onPress={() => navigation.navigate('OtpLogin')}
              testID="welcome-get-started"
            />
            <GhostButton
              label={t('welcome.useEmail')}
              onPress={() => navigation.navigate('Login')}
              testID="welcome-email-link"
            />
          </View>
        </AuthFormCard>

        <AuthTrustNote message={t('brand.trustNote')} testID="welcome-trust-note" />
      </Animated.View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    cta: {
      gap: 10,
    },
  });
}
