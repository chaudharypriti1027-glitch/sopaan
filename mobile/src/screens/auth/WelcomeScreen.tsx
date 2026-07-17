import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AuthGoldDivider,
  AuthLegalLine,
  AuthScreen,
  AuthTrustNote,
  GhostButton,
  PrimaryButton,
} from '../../components/auth';
import { SopaanLogo } from '../../components/SopaanLogo';
import { Text } from '../../components/Text';
import { AUTH_FONTS, AUTH_UI } from '../../components/auth/authTheme';
import type { AuthStackParamList } from '../../navigation/types';

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

/**
 * Guest opening screen — native recreation of the SOPAAN Sign-in reference:
 * navy canvas, gold wordmark, primary mobile CTA, secondary email CTA.
 */
export function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const navigation = useNavigation<WelcomeNav>();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(), []);

  const enterBrand = reducedMotion
    ? undefined
    : FadeInDown.duration(480).reduceMotion(ReduceMotion.System);
  const enterCta = reducedMotion
    ? undefined
    : FadeInDown.duration(420).delay(120).reduceMotion(ReduceMotion.System);

  return (
    <AuthScreen scroll={false} fill contentStyle={styles.fill}>
      <View style={styles.column}>
        <View style={styles.spacerTop} />

        <Animated.View entering={enterBrand} style={styles.brand} testID="welcome-hero">
          <View style={styles.logoWrap}>
            <View style={styles.logoHalo} pointerEvents="none" />
            <SopaanLogo size={98} />
          </View>

          <Text style={styles.wordmark} accessibilityRole="header">
            S<Text style={styles.wordmarkO}>O</Text>PAAN
          </Text>

          <AuthGoldDivider />

          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </Animated.View>

        <View style={styles.spacerMid} />

        <Animated.View entering={enterCta} style={styles.ctaBlock}>
          <PrimaryButton
            label={t('welcome.getStarted')}
            onPress={() => navigation.navigate('OtpLogin')}
            testID="welcome-get-started"
          />
          <GhostButton
            tone="canvas"
            label={t('welcome.useEmail')}
            onPress={() => navigation.navigate('Login')}
            testID="welcome-email-link"
          />

          <AuthTrustNote message={t('brand.trustNote')} testID="welcome-trust-note" />
          <AuthLegalLine testID="welcome-legal" />
        </Animated.View>
      </View>
    </AuthScreen>
  );
}

function createStyles() {
  return StyleSheet.create({
    fill: {
      flex: 1,
    },
    column: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      minHeight: 520,
    },
    spacerTop: {
      flex: 1.05,
      minHeight: 24,
    },
    spacerMid: {
      flex: 1,
      minHeight: 28,
    },
    brand: {
      alignItems: 'center',
    },
    logoWrap: {
      width: 98,
      height: 98,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      shadowColor: AUTH_UI.gold,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.34,
      shadowRadius: 24,
      elevation: 12,
    },
    logoHalo: {
      position: 'absolute',
      width: 156,
      height: 156,
      borderRadius: 78,
      backgroundColor: 'rgba(212,175,55,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(240,212,136,0.06)',
    },
    wordmark: {
      fontFamily: AUTH_FONTS.display,
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: 10,
      color: AUTH_UI.onCanvas,
      textAlign: 'center',
      marginTop: 28,
      textShadowColor: 'rgba(212,175,55,0.18)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 16,
    },
    wordmarkO: {
      fontFamily: AUTH_FONTS.display,
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: 10,
      color: AUTH_UI.goldLt,
    },
    tagline: {
      fontFamily: AUTH_FONTS.medium,
      fontStyle: 'italic',
      fontSize: 20,
      lineHeight: 26,
      color: AUTH_UI.onCanvasMuted,
      textAlign: 'center',
      marginTop: 14,
      letterSpacing: 0.8,
    },
    ctaBlock: {
      gap: 14,
      paddingBottom: 4,
    },
  });
}
