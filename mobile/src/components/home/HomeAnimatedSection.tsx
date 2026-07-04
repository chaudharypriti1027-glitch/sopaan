import { memo, type ReactNode } from 'react';
import Animated, { FadeInDown, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

type HomeAnimatedSectionProps = {
  index: number;
  children: ReactNode;
};

const BASE_MS = 260;
const STAGGER_MS = 35;
const MAX_STAGGER_INDEX = 4;

/** Subtle premium enter — capped stagger, skipped when reduce-motion is on. */
export const HomeAnimatedSection = memo(function HomeAnimatedSection({
  index,
  children,
}: HomeAnimatedSectionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(BASE_MS)
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
});
