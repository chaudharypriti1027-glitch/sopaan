import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../Text';
import { HomePremiumButton } from './HomePremiumButton';
import { HOME_PREMIUM_STRIP } from '../../content/homeContent';
import { denseTextProps } from '../../a11y/textProps';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import { HOME_UI } from './homeTheme';
import { useProGate } from '../../hooks/useProGate';

type HomeProUpgradeStripProps = {
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Compact Sopaan Pro strip — navy/gold, single press target, bare Upgrade glyph.
 */
export function HomeProUpgradeStrip({ onPress }: HomeProUpgradeStripProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const { tier } = useProGate();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const welcomeOffer = tier?.welcomeMonthEnabled !== false;
  const title = t(`home.${HOME_PREMIUM_STRIP.titleKey}`);
  const subtitle = welcomeOffer
    ? t('home.premiumStripSubtitle')
    : t('home.premiumStripSubtitleFallback');
  const cta = welcomeOffer ? t('home.premiumStripCta') : t('home.premiumStripCtaUpgrade');

  const shimmer = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [reduceMotion, shimmer]);

  const enter = reduceMotion
    ? undefined
    : FadeInDown.duration(380).delay(40).reduceMotion(ReduceMotion.System);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-60, 260]) },
      { rotate: '16deg' },
    ],
    opacity: reduceMotion ? 0 : interpolate(shimmer.value, [0, 0.25, 0.75, 1], [0, 0.22, 0.22, 0]),
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.985]) }],
  }));

  return (
    <Animated.View entering={enter}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityHint={cta}
        onPress={onPress}
        onPressIn={() => {
          press.value = withSpring(1, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          press.value = withSpring(0, { damping: 16, stiffness: 260 });
        }}
        style={pressStyle}
        testID={HOME_PREMIUM_STRIP.testID}
      >
        <LinearGradient
          colors={[...HOME_UI.heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.glowOrb} pointerEvents="none" />
          <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />

          <View style={styles.iconFill}>
            <Crown size={15} color="#FFFFFF" strokeWidth={2.2} />
          </View>

          <View style={styles.copy}>
            <Text {...denseTextProps} style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            <Text
              {...denseTextProps}
              style={styles.subtitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          </View>

          <HomePremiumButton
            label={cta}
            variant="gold"
            size="sm"
            trailingIcon={ArrowRight}
            inert
          />
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 20,
      paddingLeft: 12,
      paddingRight: 10,
      paddingVertical: 11,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(233,207,141,0.26)',
      ...platformShadow({
        color: HOME_UI.shadow,
        offsetY: 10,
        opacity: 0.22,
        radius: 16,
        elevation: 6,
      }),
    },
    glowOrb: {
      position: 'absolute',
      top: -40,
      right: -24,
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: 'rgba(201,162,75,0.18)',
    },
    shimmer: {
      position: 'absolute',
      top: -16,
      bottom: -16,
      width: 42,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    iconFill: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(201,162,75,0.95)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      zIndex: 2,
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
      zIndex: 2,
    },
    title: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.15,
    },
    subtitle: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: theme.typography.fonts.ui.medium,
      color: 'rgba(255,255,255,0.74)',
    },
  });
}
