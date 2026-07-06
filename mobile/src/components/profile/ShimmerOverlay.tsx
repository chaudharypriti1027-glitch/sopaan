import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type ShimmerOverlayProps = {
  style?: StyleProp<ViewStyle>;
  delayMs?: number;
  durationMs?: number;
};

/** Gold light sweep — matches HTML `.pro::after` shimmer. */
export function ShimmerOverlay({
  style,
  delayMs = 1000,
  durationMs = 4000,
}: ShimmerOverlayProps) {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(-1.2);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    translateX.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.4, {
            duration: durationMs,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-1.2, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [delayMs, durationMs, reducedMotion, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value * 100}%` }, { skewX: '-18deg' }],
  }));

  if (reducedMotion) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.shimmer, style, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '42%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
