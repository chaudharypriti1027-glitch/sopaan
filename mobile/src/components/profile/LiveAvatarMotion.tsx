import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AVATAR_MOTION } from './avatarMotion';

type LiveAvatarMotionProps = {
  children: ReactNode;
  live?: boolean;
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Subtle breathe + shimmer — profile hero and home avatar. */
export function LiveAvatarMotion({
  children,
  live = true,
  shimmer = true,
  style,
}: LiveAvatarMotionProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    if (!live || reducedMotion) {
      scale.value = 1;
      shimmerX.value = -1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(AVATAR_MOTION.breatheScale, { duration: AVATAR_MOTION.breatheDurationMs / 2 }),
        withTiming(1, { duration: AVATAR_MOTION.breatheDurationMs / 2 }),
      ),
      -1,
    );

    if (shimmer) {
      shimmerX.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 600 }),
          withTiming(1.4, { duration: AVATAR_MOTION.shimmerDurationMs }),
          withTiming(-1, { duration: 400 }),
        ),
        -1,
      );
    }
  }, [live, reducedMotion, scale, shimmer, shimmerX]);

  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer && !reducedMotion ? 0.55 : 0,
    transform: [{ translateX: shimmerX.value * 18 }, { rotate: '18deg' }],
  }));

  return (
    <Animated.View style={[style, motionStyle]}>
      {children}
      {shimmer ? (
        <View style={styles.shimmerMask} pointerEvents="none">
          <Animated.View style={[styles.shimmerBeam, shimmerStyle]} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shimmerMask: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerBeam: {
    position: 'absolute',
    top: -8,
    left: '30%',
    width: 14,
    height: '140%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
