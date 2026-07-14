import { memo, useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { PROFILE_MOTION } from './profileMotion';

type ProfileAnimatedSectionProps = {
  index: number;
  replayKey: number;
  children: ReactNode;
};

/**
 * Imperative reveal — works inside ScrollView + bottom tabs (unlike layout `entering`).
 */
export const ProfileAnimatedSection = memo(function ProfileAnimatedSection({
  index,
  replayKey,
  children,
}: ProfileAnimatedSectionProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : PROFILE_MOTION.revealTranslateY);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const delay = PROFILE_MOTION.revealBaseDelayMs + index * PROFILE_MOTION.revealStaggerMs;
    opacity.value = 0;
    translateY.value = PROFILE_MOTION.revealTranslateY;

    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: PROFILE_MOTION.revealDurationMs,
        easing: PROFILE_MOTION.easeOut,
      }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: PROFILE_MOTION.revealDurationMs,
        easing: PROFILE_MOTION.easeOut,
      }),
    );
  }, [replayKey, index, reducedMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
});
