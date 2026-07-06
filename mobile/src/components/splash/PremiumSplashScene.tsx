import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
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
import { platformShadow } from '../../utils/platformShadow';

const LOADER_TRACK_WIDTH = 200;
const LOADING_PHASE_MS = 2000;

const particleBase = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: '#E3C97F',
  },
  climbBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: '#C29A4E',
  },
});

type PremiumSplashSceneProps = {
  reducedMotion: boolean;
};

type ParticleSpec = {
  left: number;
  top: number;
  size: number;
  delay: number;
  drift: number;
};

const PARTICLES: ParticleSpec[] = [
  { left: 12, top: 18, size: 4, delay: 0, drift: -14 },
  { left: 78, top: 8, size: 3, delay: 400, drift: -18 },
  { left: 28, top: 62, size: 5, delay: 900, drift: -12 },
  { left: 88, top: 44, size: 3, delay: 300, drift: -16 },
  { left: 52, top: 24, size: 4, delay: 700, drift: -20 },
  { left: 6, top: 48, size: 3, delay: 1100, drift: -10 },
  { left: 64, top: 70, size: 4, delay: 500, drift: -15 },
  { left: 38, top: 6, size: 3, delay: 1300, drift: -17 },
  { left: 92, top: 28, size: 4, delay: 200, drift: -13 },
  { left: 18, top: 74, size: 3, delay: 1000, drift: -19 },
];

function SplashParticle({
  spec,
  reducedMotion,
}: {
  spec: ParticleSpec;
  reducedMotion: boolean;
}) {
  const progress = useSharedValue(reducedMotion ? 0.5 : 0);

  useEffect(() => {
    if (reducedMotion) return;

    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [progress, reducedMotion, spec.delay]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value * 0.75,
    transform: [
      { translateY: progress.value * spec.drift },
      { scale: 0.6 + progress.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        particleBase.particle,
        {
          left: `${spec.left}%` as `${number}%`,
          top: `${spec.top}%` as `${number}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
        },
        style,
      ]}
    />
  );
}

function ClimbBar({
  index,
  reducedMotion,
}: {
  index: number;
  reducedMotion: boolean;
}) {
  const height = useSharedValue(reducedMotion ? 1 : 0.25);

  useEffect(() => {
    if (reducedMotion) return;

    height.value = withDelay(
      index * 140,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
          withTiming(0.3, { duration: 680, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [height, index, reducedMotion]);

  const barStyle = useAnimatedStyle(() => ({
    height: 8 + height.value * 18,
    opacity: 0.45 + height.value * 0.55,
  }));

  return <Animated.View style={[particleBase.climbBar, barStyle]} />;
}

export function PremiumSplashScene({ reducedMotion }: PremiumSplashSceneProps) {
  const { t } = useTranslation('auth');
  const [loadingPhase, setLoadingPhase] = useState(0);

  const loadingMessages = useMemo(
    () => [t('splash.loading'), t('splash.loadingProfile'), t('splash.loadingAlmost')],
    [t],
  );

  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const logoScale = useSharedValue(reducedMotion ? 1 : 0.55);
  const logoFloat = useSharedValue(0);
  const wordmarkY = useSharedValue(reducedMotion ? 0 : 22);
  const wordmarkOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const taglineOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const orbitRotation = useSharedValue(0);
  const shimmerX = useSharedValue(-1);
  const ring1 = useSharedValue(reducedMotion ? 1 : 0.72);
  const ring2 = useSharedValue(reducedMotion ? 1 : 0.78);
  const ring3 = useSharedValue(reducedMotion ? 1 : 0.84);
  const ringOpacity1 = useSharedValue(reducedMotion ? 0.5 : 0);
  const ringOpacity2 = useSharedValue(reducedMotion ? 0.65 : 0);
  const ringOpacity3 = useSharedValue(reducedMotion ? 0.8 : 0);
  const orbDrift = useSharedValue(0);
  const loaderX = useSharedValue(-0.3);
  const loaderGlow = useSharedValue(0.4);
  const statusOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cornerOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const messageOpacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(() => {
      messageOpacity.value = withSequence(
        withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
      );
      setLoadingPhase((prev) => (prev + 1) % loadingMessages.length);
    }, LOADING_PHASE_MS);

    return () => clearInterval(interval);
  }, [loadingMessages.length, messageOpacity, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    logoOpacity.value = withTiming(1, {
      duration: 680,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
    logoScale.value = withSpring(1, {
      damping: 14,
      stiffness: 160,
      mass: 0.85,
    });
    logoFloat.value = withDelay(
      720,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    wordmarkY.value = withDelay(
      280,
      withSpring(0, { damping: 16, stiffness: 140 }),
    );
    wordmarkOpacity.value = withDelay(
      280,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    taglineOpacity.value = withDelay(
      480,
      withTiming(1, { duration: 460, easing: Easing.out(Easing.quad) }),
    );
    orbitRotation.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
    shimmerX.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    ring1.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.72, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    ring2.value = withDelay(
      360,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.78, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    ring3.value = withDelay(
      720,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.84, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    ringOpacity1.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 2200 }),
        withTiming(0.15, { duration: 2200 }),
      ),
      -1,
      true,
    );
    ringOpacity2.value = withDelay(
      360,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 2400 }),
          withTiming(0.2, { duration: 2400 }),
        ),
        -1,
        true,
      ),
    );
    ringOpacity3.value = withDelay(
      720,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 2600 }),
          withTiming(0.28, { duration: 2600 }),
        ),
        -1,
        true,
      ),
    );
    orbDrift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    loaderX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-0.3, { duration: 0 }),
      ),
      -1,
      false,
    );
    loaderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    statusOpacity.value = withDelay(
      620,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    cornerOpacity.value = withDelay(
      120,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [
    cornerOpacity,
    loaderGlow,
    loaderX,
    logoFloat,
    logoOpacity,
    logoScale,
    orbitRotation,
    orbDrift,
    reducedMotion,
    ring1,
    ring2,
    ring3,
    ringOpacity1,
    ringOpacity2,
    ringOpacity3,
    shimmerX,
    statusOpacity,
    taglineOpacity,
    wordmarkOpacity,
    wordmarkY,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoFloat.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 72 }],
    opacity: 0.35 + logoOpacity.value * 0.45,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: ringOpacity1.value,
    transform: [{ scale: ring1.value }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: ringOpacity2.value,
    transform: [{ scale: ring2.value }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    opacity: ringOpacity3.value,
    transform: [{ scale: ring3.value }],
  }));

  const orbTopStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbDrift.value * 12 },
      { translateY: orbDrift.value * -8 },
      { scale: 1 + orbDrift.value * 0.06 },
    ],
  }));
  const orbBottomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbDrift.value * -14 },
      { translateY: orbDrift.value * 10 },
      { scale: 1 + (1 - orbDrift.value) * 0.05 },
    ],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loaderX.value * LOADER_TRACK_WIDTH }],
  }));

  const loaderGlowStyle = useAnimatedStyle(() => ({
    opacity: loaderGlow.value,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerOpacity.value,
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[...PREMIUM.heroGradient]}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 0.88, y: 1 }}
      style={styles.root}
    >
      <View style={styles.vignette} pointerEvents="none" />

      <Animated.View style={[styles.orbTop, orbTopStyle]} pointerEvents="none" />
      <Animated.View style={[styles.orbBottom, orbBottomStyle]} pointerEvents="none" />

      {!reducedMotion ? (
        <View style={styles.particleField} pointerEvents="none">
          {PARTICLES.map((spec, index) => (
            <SplashParticle key={index} spec={spec} reducedMotion={reducedMotion} />
          ))}
        </View>
      ) : null}

      <Animated.View style={[styles.cornerTL, cornerStyle]} pointerEvents="none" />
      <Animated.View style={[styles.cornerBR, cornerStyle]} pointerEvents="none" />

      <View style={styles.center}>
        {!reducedMotion ? (
          <View style={styles.ringsWrap} pointerEvents="none">
            <Animated.View style={[styles.ring, styles.ringOuter, ring1Style]} />
            <Animated.View style={[styles.ring, styles.ringMid, ring2Style]} />
            <Animated.View style={[styles.ring, styles.ringInner, ring3Style]} />
            <View style={styles.glow} />
          </View>
        ) : null}

        <Animated.View style={[styles.logoFrame, logoStyle]}>
          {!reducedMotion ? (
            <Animated.View style={[styles.orbitRing, orbitStyle]} pointerEvents="none">
              <View style={styles.orbitDot} />
            </Animated.View>
          ) : null}
          <View style={styles.logoRing} />
          {!reducedMotion ? (
            <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
          ) : null}
          <SopaanLogo size={96} />
        </Animated.View>

        <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
          <Text style={styles.wordmark}>
            S<Text style={styles.wordmarkO}>O</Text>PAAN
          </Text>
          <Animated.View style={taglineStyle}>
            <Text style={styles.tagline}>{t('splash.taglineShort')}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.loaderBlock, statusStyle]}>
          {!reducedMotion ? (
            <View style={styles.climbRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <ClimbBar key={index} index={index} reducedMotion={reducedMotion} />
              ))}
            </View>
          ) : null}

          <View style={styles.loaderTrack}>
            {!reducedMotion ? (
              <>
                <Animated.View style={[styles.loaderGlow, loaderGlowStyle]} />
                <Animated.View style={[styles.loaderFillWrap, loaderStyle]}>
                  <LinearGradient
                    colors={['transparent', '#8B6B2E', '#E3C97F', '#C29A4E', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.loaderFill}
                  />
                </Animated.View>
              </>
            ) : (
              <View style={styles.loaderFillStatic} />
            )}
          </View>

          <Animated.View style={messageStyle}>
            <Text style={styles.loadingStatus}>{loadingMessages[loadingPhase]}</Text>
          </Animated.View>
        </Animated.View>

        <Text style={styles.byline}>{t('splash.byline')}</Text>
      </View>
    </LinearGradient>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    vignette: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10,12,28,0.22)',
    },
    orbTop: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(194,154,78,0.1)',
    },
    orbBottom: {
      position: 'absolute',
      bottom: -90,
      left: -70,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: 'rgba(95,138,123,0.12)',
    },
    particleField: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    cornerTL: {
      position: 'absolute',
      top: 48,
      left: 30,
      width: 46,
      height: 46,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderColor: 'rgba(194,154,78,0.42)',
      borderTopLeftRadius: 12,
    },
    cornerBR: {
      position: 'absolute',
      bottom: 48,
      right: 30,
      width: 46,
      height: 46,
      borderBottomWidth: 2,
      borderRightWidth: 2,
      borderColor: 'rgba(194,154,78,0.42)',
      borderBottomRightRadius: 12,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    ringsWrap: {
      position: 'absolute',
      width: 360,
      height: 360,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.2)',
    },
    ringOuter: {
      width: 350,
      height: 350,
    },
    ringMid: {
      width: 250,
      height: 250,
      borderColor: 'rgba(194,154,78,0.28)',
    },
    ringInner: {
      width: 160,
      height: 160,
      borderColor: 'rgba(194,154,78,0.36)',
    },
    glow: {
      position: 'absolute',
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: 'rgba(194,154,78,0.14)',
    },
    logoFrame: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 30,
      width: 132,
      height: 132,
      overflow: 'visible',
      ...platformShadow({ color: '#C29A4E', offsetY: 20, opacity: 0.5, radius: 28, elevation: 12 }),
    },
    orbitRing: {
      position: 'absolute',
      width: 148,
      height: 148,
      borderRadius: 74,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.22)',
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    orbitDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#E3C97F',
      marginTop: -4,
      ...platformShadow({ color: '#E3C97F', offsetY: 0, opacity: 0.8, radius: 6, elevation: 4 }),
    },
    logoRing: {
      position: 'absolute',
      width: 132,
      height: 132,
      borderRadius: 66,
      borderWidth: 2,
      borderColor: 'rgba(194,154,78,0.5)',
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    shimmer: {
      position: 'absolute',
      width: 28,
      height: 132,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.22)',
      transform: [{ skewX: '-18deg' }],
    },
    wordmarkWrap: {
      alignItems: 'center',
      gap: 10,
      marginBottom: 52,
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: 3.5,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    wordmarkO: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: 3.5,
      color: '#E3C97F',
    },
    tagline: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 12,
      letterSpacing: 3.2,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.68)',
      textAlign: 'center',
    },
    loaderBlock: {
      position: 'absolute',
      bottom: 100,
      alignItems: 'center',
      gap: 14,
      width: '100%',
    },
    climbRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      height: 28,
      marginBottom: 2,
    },
    loaderTrack: {
      width: LOADER_TRACK_WIDTH,
      height: 6,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.22)',
    },
    loaderGlow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(194,154,78,0.18)',
      borderRadius: 99,
    },
    loaderFillWrap: {
      height: '100%',
      width: '48%',
    },
    loaderFill: {
      flex: 1,
      borderRadius: 99,
    },
    loaderFillStatic: {
      height: '100%',
      width: '36%',
      borderRadius: 99,
      backgroundColor: '#C29A4E',
      alignSelf: 'center',
    },
    loadingStatus: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 13,
      letterSpacing: 0.35,
      color: 'rgba(255,255,255,0.78)',
      textAlign: 'center',
      minHeight: 18,
    },
    byline: {
      position: 'absolute',
      bottom: 50,
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.36)',
      textAlign: 'center',
    },
  });
}
