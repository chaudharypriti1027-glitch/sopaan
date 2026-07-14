import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getHomeFeed } from '../api/home';
import { PremiumSplashScene } from '../components/splash/PremiumSplashScene';
import { isOnboardingComplete } from '../auth/onboardingComplete';
import { queryKeys } from '../hooks/queryKeys';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore, type BootstrapResult } from '../store/auth';

type SplashNav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const BRAND_HOLD_MS = 1280;
const REDUCED_MOTION_DELAY_MS = 120;
const EXIT_MS = 420;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
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

  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const playExit = () =>
      new Promise<void>((resolve) => {
        if (reducedMotion) {
          resolve();
          return;
        }

        screenScale.value = withTiming(0.97, {
          duration: EXIT_MS,
          easing: Easing.inOut(Easing.cubic),
        });
        screenOpacity.value = withTiming(
          0,
          { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(resolve)();
            }
          },
        );
      });

    void (async () => {
      const minWait = reducedMotion ? REDUCED_MOTION_DELAY_MS : BRAND_HOLD_MS;
      const [result] = await Promise.all([bootstrap(), wait(minWait)]);

      if (result.kind === 'authed' && isOnboardingComplete(result.profile)) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.home.feed(),
          queryFn: () => getHomeFeed(),
          staleTime: 60_000,
        });
      }

      await playExit();
      if (reducedMotion) {
        await wait(60);
      }

      routeAfterBootstrap(navigation, result);
    })();
  }, [bootstrap, navigation, queryClient, reducedMotion, screenOpacity, screenScale]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.fill, screenStyle]}>
        <PremiumSplashScene reducedMotion={Boolean(reducedMotion)} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1F3B',
  },
  fill: {
    flex: 1,
  },
});
