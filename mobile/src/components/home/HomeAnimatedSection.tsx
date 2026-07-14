import { memo, type ReactNode } from 'react';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { HOME_SECTION_MOTION } from '../../content/homeContent';

type HomeAnimatedSectionProps = {
  index: number;
  children: ReactNode;
};

/** Subtle premium enter — capped stagger, skipped when reduce-motion is on. */
export const HomeAnimatedSection = memo(function HomeAnimatedSection({
  index,
  children,
}: HomeAnimatedSectionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  const delay =
    Math.min(index, HOME_SECTION_MOTION.maxStaggerIndex) * HOME_SECTION_MOTION.staggerMs;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(HOME_SECTION_MOTION.baseMs)
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
});
