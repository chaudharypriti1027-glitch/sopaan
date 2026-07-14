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
};

export function AuthPremiumHero({ variant, subtitle }: AuthPremiumHeroProps) {
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

  return (
    <Animated.View
      entering={
        reducedMotion
          ? undefined
          : FadeInDown.duration(420).reduceMotion(ReduceMotion.System)
      }
      style={styles.wrap}
      testID={config.testID}
    >
      <LinearGradient
        colors={[...PREMIUM.heroGradient]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={styles.hero}
      >
        <AuthHeroAmbient />

        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.duration(360).delay(60).reduceMotion(ReduceMotion.System)
          }
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{t(config.badgeKey)}</Text>
        </Animated.View>

        <View style={styles.logoStack}>
          <AuthLogoGlow size={config.showWordmark ? 96 : 88} />
          {config.showWordmark ? (
            <Animated.View
              entering={
                reducedMotion
                  ? undefined
                  : FadeInDown.duration(420).delay(120).reduceMotion(ReduceMotion.System)
              }
              style={styles.logoWrap}
            >
              <SopaanLogo size={72} />
            </Animated.View>
          ) : (
            <Animated.View
              entering={
                reducedMotion
                  ? undefined
                  : FadeInDown.duration(420).delay(120).reduceMotion(ReduceMotion.System)
              }
            >
              <AuthLogo />
            </Animated.View>
          )}
        </View>

        {config.showWordmark ? (
          <Animated.View
            entering={
              reducedMotion
                ? undefined
                : FadeInDown.duration(400).delay(180).reduceMotion(ReduceMotion.System)
            }
          >
            <Text style={styles.wordmark}>
              S<Text style={styles.wordmarkO}>O</Text>PAAN
            </Text>
          </Animated.View>
        ) : null}

        {config.titleKey ? (
          <Animated.View
            entering={
              reducedMotion
                ? undefined
                : FadeInDown.duration(400).delay(180).reduceMotion(ReduceMotion.System)
            }
          >
            <Text style={styles.title}>{t(config.titleKey)}</Text>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.duration(400).delay(220).reduceMotion(ReduceMotion.System)
          }
        >
          <Text style={styles.subtitle}>{resolvedSubtitle}</Text>
        </Animated.View>

        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.duration(360).delay(260).reduceMotion(ReduceMotion.System)
          }
          style={styles.hairline}
        />

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
            {AUTH_BRAND_VALUES.map((item, chipIndex) => {
              const Icon = item.icon;
              return (
                <Animated.View
                  key={item.key}
                  entering={
                    reducedMotion
                      ? undefined
                      : FadeInDown.duration(360)
                          .delay(300 + chipIndex * 70)
                          .reduceMotion(ReduceMotion.System)
                  }
                  style={styles.valueChip}
                >
                  <View style={styles.valueIcon}>
                    <Icon size={14} color="#E3C97F" strokeWidth={2.2} />
                  </View>
                  <Text style={styles.valueLabel} numberOfLines={2}>
                    {t(item.labelKey)}
                  </Text>
                </Animated.View>
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
    hero: {
      borderRadius: AUTH_UI.cardRadius,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 26,
      alignItems: 'center',
      gap: AUTH_SPACING.stack,
      overflow: 'hidden',
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 99,
      backgroundColor: 'rgba(245,158,11,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.38)',
    },
    badgeText: {
      fontFamily: AUTH_FONTS.bold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: '#E3C97F',
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
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: 1.1,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    wordmarkO: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: 1.1,
      color: '#E3C97F',
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
      fontSize: 14,
      lineHeight: 20,
      color: 'rgba(255,255,255,0.76)',
      textAlign: 'center',
      maxWidth: 300,
    },
    hairline: {
      width: 44,
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
