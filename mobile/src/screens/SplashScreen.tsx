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
import { colors } from '../theme/tokens';

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const LOGO_IN_MS = 520;
const SHIMMER_MS = 720;
const SHIMMER_DELAY_MS = 380;
const HOLD_MS = 700;
const REDUCED_MOTION_DELAY_MS = 120;

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

  await wait(LOGO_IN_MS + SHIMMER_DELAY_MS + SHIMMER_MS + HOLD_MS);
}

function resetToLogin(navigation: SplashNav) {
  navigation.reset({
    index: 0,
    routes: [
      {
        name: 'Auth',
        state: {
          index: 0,
          routes: [{ name: 'Login' }],
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

function routeAfterBootstrap(navigation: SplashNav, result: BootstrapResult) {
  if (result.kind === 'guest') {
    resetToLogin(navigation);
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
  const wordmarkOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const shimmerX = useSharedValue(reducedMotion ? 200 : -140);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
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
      wordmarkOpacity.value = withDelay(
        180,
        withTiming(1, {
          duration: 420,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
      );
      shimmerX.value = withDelay(
        SHIMMER_DELAY_MS,
        withSequence(
          withTiming(220, {
            duration: SHIMMER_MS,
            easing: Easing.inOut(Easing.quad),
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(220, { duration: HOLD_MS, reduceMotion: ReduceMotion.System }),
        ),
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
    logoOpacity,
    logoScale,
    navigation,
    queryClient,
    reducedMotion,
    shimmerX,
    wordmarkOpacity,
  ]);

  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[colors.boardPrimary, colors.boardPrimaryDeep]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.root}
    >
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <SopaanLogo size={112} showBackground={false} />
        </Animated.View>

        <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
          <View style={styles.wordmarkClip}>
            <Text style={styles.wordmark}>Sopaan</Text>
            {!reducedMotion ? (
              <Animated.View pointerEvents="none" style={[styles.shimmerTrack, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.42)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.shimmerBand}
                />
              </Animated.View>
            ) : null}
          </View>
          <Text style={styles.tagline}>Climb your rank</Text>
        </Animated.View>
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
      gap: 28,
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmarkWrap: {
      alignItems: 'center',
      gap: 10,
    },
    wordmarkClip: {
      overflow: 'hidden',
      position: 'relative',
    },
    wordmark: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 44,
      lineHeight: 48,
      letterSpacing: -0.8,
      color: colors.white,
      textAlign: 'center',
    },
    shimmerTrack: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 120,
    },
    shimmerBand: {
      flex: 1,
      width: 120,
    },
    tagline: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: 16,
      lineHeight: 22,
      color: 'rgba(255,255,255,0.78)',
      textAlign: 'center',
    },
  });
}
