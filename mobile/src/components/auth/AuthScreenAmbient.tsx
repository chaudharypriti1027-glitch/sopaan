import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AUTH_UI } from './authTheme';

/** Slow-drifting ambient blobs on auth cream canvas. */
export function AuthScreenAmbient() {
  const reducedMotion = useReducedMotion();
  const gold = useSharedValue(0);
  const sage = useSharedValue(0);
  const navy = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    gold.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    sage.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    navy.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [gold, navy, reducedMotion, sage]);

  const goldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: gold.value * 14 },
      { translateY: gold.value * -10 },
      { scale: 1 + gold.value * 0.06 },
    ],
  }));

  const sageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sage.value * -12 },
      { translateY: sage.value * 8 },
      { scale: 1 + sage.value * 0.05 },
    ],
  }));

  const navyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: navy.value * 10 },
      { translateY: navy.value * 6 },
      { scale: 1 + navy.value * 0.04 },
    ],
    opacity: 0.28 + navy.value * 0.12,
  }));

  return (
    <>
      <Animated.View style={[styles.gold, goldStyle]} pointerEvents="none" />
      <Animated.View style={[styles.sage, sageStyle]} pointerEvents="none" />
      <Animated.View style={[styles.navy, navyStyle]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  gold: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: AUTH_UI.goldSoft,
  },
  sage: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: AUTH_UI.sageSoft,
  },
  navy: {
    position: 'absolute',
    top: '38%',
    left: -120,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: AUTH_UI.accentSoft,
  },
});
