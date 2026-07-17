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

const LOADER_WIDTH = 132;

type PremiumSplashSceneProps = {
  reducedMotion: boolean;
};

export function PremiumSplashScene({ reducedMotion }: PremiumSplashSceneProps) {
  const { t } = useTranslation('auth');
  const insets = useSafeAreaInsets();

  const markOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const markScale = useSharedValue(reducedMotion ? 1 : 0.86);
  const glowOpacity = useSharedValue(reducedMotion ? 0.55 : 0);
  const copyOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const copyY = useSharedValue(reducedMotion ? 0 : 16);
  const footerOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const loaderX = useSharedValue(-0.4);
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;

    markOpacity.value = withTiming(1, {
      duration: 560,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
    markScale.value = withSpring(1, {
      damping: 16,
      stiffness: 150,
      mass: 0.85,
    });
    glowOpacity.value = withDelay(
      120,
      withTiming(0.7, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
    copyOpacity.value = withDelay(
      180,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }),
    );
    copyY.value = withDelay(180, withSpring(0, { damping: 17, stiffness: 140 }));
    footerOpacity.value = withDelay(
      360,
      withTiming(1, { duration: 440, easing: Easing.out(Easing.quad) }),
    );
    breath.value = withDelay(
      640,
      withRepeat(
        withSequence(
          withTiming(1.028, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    loaderX.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1280, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-0.4, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [
    breath,
    copyOpacity,
    copyY,
    footerOpacity,
    glowOpacity,
    loaderX,
    markOpacity,
    markScale,
    reducedMotion,
  ]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value * breath.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
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
      start={{ x: 0.18, y: 0 }}
      end={{ x: 0.86, y: 1 }}
      style={styles.root}
      testID="splash-brand-scene"
    >
      <View style={styles.atmosphereTop} pointerEvents="none" />
      <View style={styles.atmosphereBottom} pointerEvents="none" />
      <View style={styles.vignette} pointerEvents="none" />

      <View style={styles.stage}>
        <View style={styles.markStage}>
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
          <Animated.View style={[styles.markWrap, markStyle]}>
            <SopaanLogo size={96} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={styles.wordmark}>
            S<Text style={styles.wordmarkAccent}>O</Text>PAAN
          </Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={[styles.dividerLine, styles.dividerLineRight]} />
          </View>
          <Text style={styles.tagline}>{t('splash.taglineShort')}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, footerStyle]}>
        <View style={styles.loaderTrack}>
          {!reducedMotion ? (
            <Animated.View style={[styles.loaderFillWrap, loaderStyle]}>
              <LinearGradient
                colors={['transparent', '#C29A4E', '#E9CF8D', '#C29A4E', 'transparent']}
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
      top: -100,
      right: -70,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: 'rgba(201,162,75,0.1)',
    },
    atmosphereBottom: {
      position: 'absolute',
      bottom: -120,
      left: -90,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: 'rgba(94,156,124,0.08)',
    },
    vignette: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10,12,24,0.22)',
    },
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 36,
      paddingTop: topInset,
      paddingBottom: 108,
      gap: 8,
    },
    markStage: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 160,
      height: 160,
      marginBottom: 8,
    },
    glow: {
      position: 'absolute',
      width: 148,
      height: 148,
      borderRadius: 74,
      backgroundColor: 'rgba(201,162,75,0.18)',
    },
    markWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 112,
      height: 112,
    },
    copy: {
      alignItems: 'center',
      gap: 14,
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: 5,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    wordmarkAccent: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: 5,
      color: '#E9CF8D',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dividerLine: {
      width: 44,
      height: StyleSheet.hairlineWidth + 0.5,
      backgroundColor: '#D4AF37',
      opacity: 0.7,
    },
    dividerLineRight: {},
    dividerDiamond: {
      width: 5,
      height: 5,
      backgroundColor: '#D4AF37',
      transform: [{ rotate: '45deg' }],
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
    },
    tagline: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 16,
      lineHeight: 23,
      letterSpacing: 0.6,
      fontStyle: 'italic',
      color: 'rgba(233,222,196,0.8)',
      textAlign: 'center',
      maxWidth: 260,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: Math.max(bottomInset, 16) + 32,
      alignItems: 'center',
      gap: 16,
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
      width: '40%',
    },
    loaderFill: {
      flex: 1,
    },
    loaderFillStatic: {
      height: '100%',
      width: '36%',
      backgroundColor: '#C9A24B',
      alignSelf: 'center',
    },
    status: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 12,
      letterSpacing: 0.3,
      color: 'rgba(255,255,255,0.48)',
      textAlign: 'center',
    },
  });
}
