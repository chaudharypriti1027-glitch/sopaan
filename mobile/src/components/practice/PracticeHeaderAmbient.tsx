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

export function PracticeHeaderAmbient() {
  const reducedMotion = useReducedMotion();
  const gold = useSharedValue(0);
  const mist = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    gold.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    mist.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [gold, mist, reducedMotion]);

  const goldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: gold.value * 12 },
      { translateY: gold.value * -8 },
      { scale: 1 + gold.value * 0.07 },
    ],
  }));

  const mistStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: mist.value * -10 },
      { translateY: mist.value * 10 },
      { scale: 1 + mist.value * 0.05 },
    ],
    opacity: 0.5 + mist.value * 0.25,
  }));

  return (
    <>
      <Animated.View style={[styles.gold, goldStyle]} pointerEvents="none" />
      <Animated.View style={[styles.mist, mistStyle]} pointerEvents="none" />
      <Animated.View style={[styles.shimmer, mistStyle]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  gold: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(194,154,78,0.22)',
  },
  mist: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  shimmer: {
    position: 'absolute',
    top: 24,
    left: '20%',
    right: '20%',
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
