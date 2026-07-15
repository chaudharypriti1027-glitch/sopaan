import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SopaanLogo } from '../SopaanLogo';
import { Text } from '../Text';
import { PREMIUM } from '../premium/premiumStyles';

const LOADER_WIDTH = 148;

type PremiumSplashSceneProps = {
  reducedMotion: boolean;
};

export function PremiumSplashScene({ reducedMotion }: PremiumSplashSceneProps) {
  const { t } = useTranslation('auth');
  const insets = useSafeAreaInsets();

  const markOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const markScale = useSharedValue(reducedMotion ? 1 : 0.88);
  const copyOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const copyY = useSharedValue(reducedMotion ? 0 : 14);
  const footerOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const loaderX = useSharedValue(-0.35);
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;

    markOpacity.value = withTiming(1, {
      duration: 640,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
    markScale.value = withSpring(1, {
      damping: 18,
      stiffness: 140,
      mass: 0.9,
    });
    copyOpacity.value = withDelay(
      220,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    copyY.value = withDelay(
      220,
      withSpring(0, { damping: 18, stiffness: 130 }),
    );
    footerOpacity.value = withDelay(
      420,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) }),
    );
    breath.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1.035, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    loaderX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-0.35, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [
    breath,
    copyOpacity,
    copyY,
    footerOpacity,
    loaderX,
    markOpacity,
    markScale,
    reducedMotion,
  ]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value * breath.value }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: copyY.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loaderX.value * LOADER_WIDTH }],
  }));

  const styles = useMemo(
    () => createStyles(insets.top, insets.bottom),
    [insets.bottom, insets.top],
  );

  return (
    <LinearGradient
      colors={[...PREMIUM.heroGradient]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.root}
      testID="splash-brand-scene"
    >
      <View style={styles.atmosphereTop} pointerEvents="none" />
      <View style={styles.atmosphereBottom} pointerEvents="none" />
      <View style={styles.vignette} pointerEvents="none" />

      <View style={styles.stage}>
        <Animated.View style={[styles.markWrap, markStyle]}>
          <SopaanLogo size={88} />
        </Animated.View>

        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={styles.wordmark}>
            S<Text style={styles.wordmarkAccent}>O</Text>PAAN
          </Text>
          <Text style={styles.tagline}>{t('splash.taglineShort')}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, footerStyle]}>
        <View style={styles.loaderTrack}>
          {!reducedMotion ? (
            <Animated.View style={[styles.loaderFillWrap, loaderStyle]}>
              <LinearGradient
                colors={['transparent', '#C29A4E', '#E3C97F', '#C29A4E', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.loaderFill}
              />
            </Animated.View>
          ) : (
            <View style={styles.loaderFillStatic} />
          )}
        </View>
        <Text style={styles.status}>{t('splash.loading')}</Text>
        <Text style={styles.byline}>{t('splash.byline')}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

function createStyles(topInset: number, bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    atmosphereTop: {
      position: 'absolute',
      top: -120,
      right: -80,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: 'rgba(194,154,78,0.09)',
    },
    atmosphereBottom: {
      position: 'absolute',
      bottom: -140,
      left: -100,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: 'rgba(95,138,123,0.1)',
    },
    vignette: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(12,14,28,0.18)',
    },
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 36,
      paddingTop: topInset,
      paddingBottom: 96,
    },
    markWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      width: 112,
      height: 112,
    },
    copy: {
      alignItems: 'center',
      gap: 12,
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: 4,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    wordmarkAccent: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: 4,
      color: '#E3C97F',
    },
    tagline: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.8,
      color: 'rgba(255,255,255,0.62)',
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: Math.max(bottomInset, 16) + 28,
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 32,
    },
    loaderTrack: {
      width: LOADER_WIDTH,
      height: 2,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.12)',
      overflow: 'hidden',
    },
    loaderFillWrap: {
      height: '100%',
      width: '42%',
    },
    loaderFill: {
      flex: 1,
    },
    loaderFillStatic: {
      height: '100%',
      width: '34%',
      backgroundColor: '#C29A4E',
      alignSelf: 'center',
    },
    status: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 12,
      letterSpacing: 0.2,
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
    },
    byline: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.28)',
      textAlign: 'center',
      marginTop: 4,
    },
  });
}
