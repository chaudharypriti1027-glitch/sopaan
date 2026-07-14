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

type AuthHeroAmbientProps = {
  disabled?: boolean;
};

export function AuthHeroAmbient({ disabled }: AuthHeroAmbientProps) {
  const reducedMotion = useReducedMotion();
  const blobA = useSharedValue(0);
  const blobB = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (disabled || reducedMotion) {
      return;
    }

    blobA.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    blobB.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.15, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [blobA, blobB, disabled, reducedMotion, shimmer]);

  const blobAStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: blobA.value * -10 },
      { translateX: blobA.value * 8 },
      { scale: 1 + blobA.value * 0.08 },
    ],
    opacity: 0.55 + blobA.value * 0.2,
  }));

  const blobBStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: blobB.value * 12 },
      { translateX: blobB.value * -10 },
      { scale: 1 + blobB.value * 0.1 },
    ],
    opacity: 0.45 + blobB.value * 0.25,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [{ translateX: shimmer.value * 24 - 12 }],
  }));

  return (
    <>
      <Animated.View style={[styles.blob, styles.blobPrimary, blobAStyle]} pointerEvents="none" />
      <Animated.View style={[styles.blob, styles.blobGold, blobBStyle]} pointerEvents="none" />
      <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobPrimary: {
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blobGold: {
    bottom: -30,
    left: -20,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(227,201,127,0.12)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: '18%',
    right: '18%',
    height: '42%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
