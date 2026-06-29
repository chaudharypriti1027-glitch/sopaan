import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

/** Gentle horizontal shake when an error appears. */
export function useShakeOnError(error: string | null | undefined) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (!error) {
      return;
    }

    shakeX.value = withSequence(
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  }, [error, shakeX]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
}
