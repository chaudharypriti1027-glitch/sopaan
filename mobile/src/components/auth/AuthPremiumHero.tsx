import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import {
  AUTH_BRAND_VALUES,
  AUTH_HERO_VARIANTS,
  type AuthHeroVariant,
} from '../../content/authBrandContent';
import { AUTH_MOTIVATION_COUNT } from '../../content/authMotivationContent';
import { SopaanLogo } from '../SopaanLogo';
import { Text } from '../Text';
import { AuthGoldDivider } from './AuthGoldDivider';
import { AuthLogo } from './AuthLogo';
import { AuthLogoGlow } from './AuthLogoGlow';
import { AuthMotivationTicker } from './AuthMotivationTicker';
import { AUTH_FONTS, AUTH_SPACING, AUTH_UI } from './authTheme';

type AuthPremiumHeroProps = {
  variant: AuthHeroVariant;
  /** Overrides config subtitle — e.g. OTP verify with masked phone. */
  subtitle?: string;
  /** Tighter treatment for form-first auth screens. */
  compact?: boolean;
};

/**
 * Brand-first auth hero on the navy canvas — logo / wordmark + tagline.
 * Value chips and motivation tickers stay opt-in per variant.
 */
export function AuthPremiumHero({ variant, subtitle, compact = false }: AuthPremiumHeroProps) {
  const { t } = useTranslation('auth');
  const config = AUTH_HERO_VARIANTS[variant];
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(), []);

  const resolvedSubtitle = subtitle ?? t(config.subtitleKey);
  const motivationLines = useMemo(
    () =>
      Array.from({ length: AUTH_MOTIVATION_COUNT }, (_, index) =>
        t(`brand.motivations.${index}`),
      ),
    [t],
  );

  const enter = reducedMotion
    ? undefined
    : FadeInDown.duration(420).reduceMotion(ReduceMotion.System);
  const enterLater = reducedMotion
    ? undefined
    : FadeInDown.duration(400).delay(140).reduceMotion(ReduceMotion.System);

  return (
    <Animated.View
      entering={enter}
      style={[styles.wrap, compact && styles.wrapCompact]}
      testID={config.testID}
    >
      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.logoStack}>
          <AuthLogoGlow size={compact ? 78 : config.showWordmark ? 104 : 88} />
          {config.showWordmark ? (
            <View style={styles.logoWrap}>
              <SopaanLogo size={compact ? 58 : 78} />
            </View>
          ) : (
            <AuthLogo />
          )}
        </View>

        <Animated.View entering={enterLater} style={styles.copy}>
          {config.showWordmark ? (
            <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>
              S
              <Text style={[styles.wordmarkO, compact && styles.wordmarkOCompact]}>O</Text>
              PAAN
            </Text>
          ) : null}

          {config.titleKey && !config.showWordmark ? (
            <Text style={styles.title}>{t(config.titleKey)}</Text>
          ) : null}

          <AuthGoldDivider compact={compact} />

          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
            {resolvedSubtitle}
          </Text>
        </Animated.View>

        {config.showMotivation ? (
          <AuthMotivationTicker
            title={t('brand.motivationTitle')}
            lines={motivationLines}
            seed={variant}
            testID={`${config.testID}-motivation`}
          />
        ) : null}

        {config.showValueChips ? (
          <View style={styles.valueRow}>
            {AUTH_BRAND_VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.key} style={styles.valueChip}>
                  <View style={styles.valueIcon}>
                    <Icon size={14} color={AUTH_UI.goldLt} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.valueLabel} numberOfLines={2}>
                    {t(item.labelKey)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      marginBottom: 4,
      zIndex: 2,
    },
    wrapCompact: {
      marginBottom: 0,
    },
    hero: {
      paddingHorizontal: 8,
      paddingTop: 12,
      paddingBottom: 8,
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
    },
    heroCompact: {
      paddingTop: 4,
      paddingBottom: 4,
      gap: 8,
    },
    logoStack: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoWrap: {
      shadowColor: AUTH_UI.gold,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.45,
      shadowRadius: 28,
      elevation: 10,
      borderRadius: 26,
    },
    copy: {
      alignItems: 'center',
      gap: 0,
    },
    wordmark: {
      fontFamily: AUTH_FONTS.display,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: 8,
      color: AUTH_UI.onCanvas,
      textAlign: 'center',
      marginTop: 22,
      textShadowColor: 'rgba(212,175,55,0.18)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 14,
    },
    wordmarkO: {
      fontFamily: AUTH_FONTS.display,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: 8,
      color: AUTH_UI.goldLt,
    },
    wordmarkCompact: {
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: 5,
      marginTop: 12,
    },
    wordmarkOCompact: {
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: 5,
    },
    title: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 24,
      fontWeight: '800',
      color: AUTH_UI.onCanvas,
      textAlign: 'center',
      letterSpacing: -0.3,
      lineHeight: 30,
      marginTop: 16,
    },
    subtitle: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 18,
      fontStyle: 'italic',
      lineHeight: 24,
      color: AUTH_UI.onCanvasMuted,
      textAlign: 'center',
      maxWidth: 300,
      marginTop: 14,
      letterSpacing: 0.6,
    },
    subtitleCompact: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: 10,
      fontStyle: 'normal',
      letterSpacing: 0.2,
      color: AUTH_UI.onCanvasFaint,
    },
    valueRow: {
      flexDirection: 'row',
      gap: 8,
      width: '100%',
      marginTop: 8,
    },
    valueChip: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(240,212,136,0.16)',
    },
    valueIcon: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    valueLabel: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      color: AUTH_UI.onCanvas,
      textAlign: 'center',
    },
  });
}
