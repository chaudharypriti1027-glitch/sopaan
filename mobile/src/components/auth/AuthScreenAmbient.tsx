import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const STAIR_HEIGHTS = [34, 66, 98, 130] as const;

/** Soft gold glow + stair motif on the dark navy auth canvas. */
export function AuthScreenAmbient() {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const styles = useMemo(() => createStyles(), []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse, reducedMotion]);

  const hazeStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.2,
    transform: [
      { translateX: pulse.value * -8 },
      { translateY: pulse.value * 6 },
    ],
  }));

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.cornerHaze, hazeStyle]} />
      <View style={styles.stairs}>
        {STAIR_HEIGHTS.map((height, index) => (
          <View
            key={height}
            style={[
              styles.stair,
              {
                height,
                left: index * 64 - 10,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
      zIndex: 0,
    },
    cornerHaze: {
      position: 'absolute',
      top: -120,
      right: -140,
      width: 340,
      height: 340,
      borderRadius: 170,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    stairs: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 140,
    },
    stair: {
      position: 'absolute',
      bottom: 0,
      width: 64,
      backgroundColor: 'rgba(240,212,136,0.035)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(240,212,136,0.09)',
    },
  });
}
