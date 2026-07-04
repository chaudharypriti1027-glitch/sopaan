import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SopaanLogo } from '../components';
import { Text } from '../components/Text';
import { getHomeFeed } from '../api/home';
import { isOnboardingComplete } from '../auth/onboardingComplete';
import { queryKeys } from '../hooks/queryKeys';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore, type BootstrapResult } from '../store/auth';
import { PREMIUM } from '../components/premium/premiumStyles';
import { platformShadow } from '../utils/platformShadow';

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const LOGO_IN_MS = 520;
const WORDMARK_DELAY_MS = 220;
const WORDMARK_MS = 420;
const HOLD_MS = 900;
const REDUCED_MOTION_DELAY_MS = 120;
const LOADER_TRACK_WIDTH = 150;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForBrandMoment(reducedMotion: boolean) {
  if (reducedMotion) {
    await wait(REDUCED_MOTION_DELAY_MS);
    return;
  }

  await wait(LOGO_IN_MS + WORDMARK_DELAY_MS + WORDMARK_MS + HOLD_MS);
}

function resetToWelcome(navigation: SplashNav) {
  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'Auth',
        state: {
          index: 0,
          routes: [{ name: 'Welcome' }],
        },
      },
    ],
  });
}

function resetToProfileSetup(navigation: SplashNav) {
  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'Auth',
        state: {
          index: 0,
          routes: [{ name: 'ProfileSetup' }],
        },
      },
    ],
  });
}

function resetToHome(navigation: SplashNav) {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Main' }],
  });
}

function resetToAdminPortal(navigation: SplashNav) {
  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'Auth',
        state: {
          index: 0,
          routes: [{ name: 'AdminPortal' }],
        },
      },
    ],
  });
}

function routeAfterBootstrap(navigation: SplashNav, result: BootstrapResult) {
  if (result.kind === 'admin_portal') {
    resetToAdminPortal(navigation);
    return;
  }

  if (result.kind === 'guest') {
    resetToWelcome(navigation);
    return;
  }

  if (isOnboardingComplete(result.profile)) {
    resetToHome(navigation);
    return;
  }

  resetToProfileSetup(navigation);
}

export function SplashScreen() {
  const navigation = useNavigation<SplashNav>();
  const queryClient = useQueryClient();
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const reducedMotion = useReducedMotion();
  const hasStarted = useRef(false);

  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const logoScale = useSharedValue(reducedMotion ? 1 : 0.86);
  const logoFloat = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);
  const loaderX = useSharedValue(-0.4);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoFloat.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loaderX.value * LOADER_TRACK_WIDTH }],
  }));

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    if (!reducedMotion) {
      logoOpacity.value = withTiming(1, {
        duration: LOGO_IN_MS,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });
      logoScale.value = withTiming(1, {
        duration: LOGO_IN_MS,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });
      logoFloat.value = withDelay(
        LOGO_IN_MS,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );
      wordmarkOpacity.value = withDelay(
        WORDMARK_DELAY_MS,
        withTiming(1, {
          duration: WORDMARK_MS,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.6, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      loaderX.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
          withTiming(-0.4, { duration: 0 }),
        ),
        -1,
        false,
      );
    }

    void (async () => {
      const [result] = await Promise.all([bootstrap(), waitForBrandMoment(Boolean(reducedMotion))]);

      if (result.kind === 'authed' && isOnboardingComplete(result.profile)) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.home.feed(),
          queryFn: getHomeFeed,
          staleTime: 60_000,
        });
      }

      routeAfterBootstrap(navigation, result);
    })();
  }, [
    bootstrap,
    loaderX,
    logoFloat,
    logoOpacity,
    logoScale,
    navigation,
    queryClient,
    reducedMotion,
    ringOpacity,
    ringScale,
    wordmarkOpacity,
  ]);

  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[...PREMIUM.heroGradient]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.root}
    >
      <View style={styles.center}>
        {!reducedMotion ? (
          <View style={[styles.ringsWrap, styles.pointerNone]}>
            <Animated.View style={[styles.ring, styles.ringOuter, ringStyle]} />
            <Animated.View style={[styles.ring, styles.ringMid, ringStyle]} />
            <Animated.View style={[styles.ring, styles.ringInner, ringStyle]} />
            <View style={styles.glow} />
          </View>
        ) : null}

        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <SopaanLogo size={100} />
        </Animated.View>

        <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
          <Text style={styles.wordmark}>
            S<Text style={styles.wordmarkO}>O</Text>PAAN
          </Text>
          <Text style={styles.tagline}>CLIMB YOUR RANK</Text>
        </Animated.View>

        {!reducedMotion ? (
          <View style={styles.loaderTrack}>
            <Animated.View style={[styles.loaderFill, loaderStyle]} />
          </View>
        ) : null}

        <Text style={styles.byline}>EXAM PREP · POWERED BY AI</Text>
      </View>
    </LinearGradient>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    ringsWrap: {
      position: 'absolute',
      width: 340,
      height: 340,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.16)',
    },
    ringOuter: {
      width: 330,
      height: 330,
      borderColor: 'rgba(194,154,78,0.08)',
    },
    ringMid: {
      width: 240,
      height: 240,
      borderColor: 'rgba(194,154,78,0.12)',
    },
    ringInner: {
      width: 150,
      height: 150,
    },
    glow: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(194,154,78,0.16)',
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 30,
      ...platformShadow({ color: '#C29A4E', offsetY: 18, opacity: 0.45, radius: 24, elevation: 10 }),
    },
    wordmarkWrap: {
      alignItems: 'center',
      gap: 9,
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: 3,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    wordmarkO: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: 3,
      color: '#E3C97F',
    },
    tagline: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 12,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.65)',
      textAlign: 'center',
    },
    loaderTrack: {
      position: 'absolute',
      bottom: 88,
      width: LOADER_TRACK_WIDTH,
      height: 4,
      borderRadius: 99,
      backgroundColor: 'rgba(255,255,255,0.14)',
      overflow: 'hidden',
    },
    loaderFill: {
      height: '100%',
      width: '40%',
      borderRadius: 99,
      backgroundColor: '#C29A4E',
    },
    byline: {
      position: 'absolute',
      bottom: 52,
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 11,
      letterSpacing: 1,
      color: 'rgba(255,255,255,0.4)',
      textAlign: 'center',
    },
    pointerNone: {
      pointerEvents: 'none',
    },
  });
}
