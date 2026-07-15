import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { AuthHeroAmbient } from './AuthHeroAmbient';
import { AuthLogo } from './AuthLogo';
import { AuthLogoGlow } from './AuthLogoGlow';
import { AuthMotivationTicker } from './AuthMotivationTicker';
import { AUTH_FONTS, AUTH_SPACING, AUTH_UI } from './authTheme';
import { PREMIUM } from '../premium/premiumStyles';

type AuthPremiumHeroProps = {
  variant: AuthHeroVariant;
  /** Overrides config subtitle — e.g. OTP verify with masked phone. */
  subtitle?: string;
  /** Tighter, separated treatment for form-first auth screens. */
  compact?: boolean;
};

/**
 * Brand-first auth hero — logo / wordmark + one line of support copy.
 * Value chips, badges, and motivation tickers stay opt-in per variant.
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
      <LinearGradient
        colors={[...PREMIUM.heroGradient]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={[styles.hero, compact && styles.heroCompact]}
      >
        <AuthHeroAmbient />

        <View style={styles.logoStack}>
          <AuthLogoGlow size={compact ? 78 : config.showWordmark ? 96 : 88} />
          {config.showWordmark ? (
            <View style={styles.logoWrap}>
              <SopaanLogo size={compact ? 58 : 72} />
            </View>
          ) : (
            <AuthLogo />
          )}
        </View>

        <Animated.View entering={enterLater} style={styles.copy}>
          {config.showWordmark ? (
            <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>
              S<Text style={[styles.wordmarkO, compact && styles.wordmarkCompact]}>O</Text>PAAN
            </Text>
          ) : null}

          {config.titleKey && !config.showWordmark ? (
            <Text style={styles.title}>{t(config.titleKey)}</Text>
          ) : null}

          <Text style={styles.subtitle}>{resolvedSubtitle}</Text>

          <View style={styles.hairline} />
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
      </LinearGradient>
    </Animated.View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      marginBottom: -18,
      zIndex: 2,
    },
    wrapCompact: {
      marginBottom: -8,
    },
    hero: {
      borderRadius: AUTH_UI.cardRadius,
      paddingHorizontal: 22,
      paddingTop: 28,
      paddingBottom: 30,
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
      overflow: 'hidden',
    },
    heroCompact: {
      paddingTop: 20,
      paddingBottom: 22,
      gap: 10,
    },
    logoStack: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoWrap: {
      shadowColor: AUTH_UI.gold,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 8,
    },
    copy: {
      alignItems: 'center',
      gap: 10,
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: 1.2,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    wordmarkO: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: 1.2,
      color: AUTH_UI.goldLt,
    },
    wordmarkCompact: {
      fontSize: 24,
      lineHeight: 29,
    },
    title: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: -0.4,
      lineHeight: 30,
    },
    subtitle: {
      fontFamily: AUTH_FONTS.medium,
      fontSize: 15,
      lineHeight: 21,
      color: 'rgba(255,255,255,0.78)',
      textAlign: 'center',
      maxWidth: 280,
    },
    hairline: {
      width: 40,
      height: 2,
      borderRadius: 99,
      backgroundColor: AUTH_UI.gold,
      marginTop: 2,
    },
    valueRow: {
      flexDirection: 'row',
      gap: 8,
      width: '100%',
      marginTop: 4,
    },
    valueChip: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    valueIcon: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    valueLabel: {
      fontFamily: AUTH_FONTS.semibold,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
    },
  });
}
