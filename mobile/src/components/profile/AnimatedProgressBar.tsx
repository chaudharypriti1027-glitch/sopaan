import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { PROFILE_MOTION } from './profileMotion';

type AnimatedProgressBarProps = {
  progress: number;
  replayKey: number;
  colors: readonly [string, string];
  height?: number;
  delayMs?: number;
  trackColor?: string;
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
};

function ProgressShimmer() {
  const reducedMotion = useReducedMotion();
  const left = useSharedValue(-0.4);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    left.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-0.4, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, [left, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    left: `${left.value * 100}%`,
  }));

  if (reducedMotion) {
    return null;
  }

  return <Animated.View style={[styles.shimmer, style]} />;
}

export function AnimatedProgressBar({
  progress,
  replayKey,
  colors,
  height = 9,
  delayMs = PROFILE_MOTION.progressDelayMs,
  trackColor = '#F3F0E8',
  shimmer = false,
  style,
}: AnimatedProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const widthPct = useSharedValue(reducedMotion ? progress * 100 : 0);
  const clamped = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    const target = clamped * 100;
    if (reducedMotion) {
      widthPct.value = target;
      return;
    }

    widthPct.value = 0;
    widthPct.value = withDelay(
      delayMs,
      withTiming(target, {
        duration: PROFILE_MOTION.progressDurationMs,
        easing: PROFILE_MOTION.easeOut,
      }),
    );
  }, [clamped, replayKey, delayMs, reducedMotion, widthPct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <Animated.View style={[styles.fillWrap, fillStyle]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        />
        {shimmer ? <ProgressShimmer /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 99,
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 99,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
