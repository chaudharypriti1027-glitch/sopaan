import { type ReactNode } from 'react';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useReducedMotion } from 'react-native-reanimated';

type AuthAnimatedSectionProps = {
  index: number;
  children: ReactNode;
};

/** Staggered enter animation for auth form sections. */
export function AuthAnimatedSection({ index, children }: AuthAnimatedSectionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70)
        .duration(340)
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}
