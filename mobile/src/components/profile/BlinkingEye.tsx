import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AVATAR_MOTION, randomBlinkDelayMs } from './avatarMotion';

type BlinkingEyeProps = {
  size: number;
  iris: string;
  lidColor?: string;
  live?: boolean;
  lid?: SharedValue<number>;
};

export function useAvatarBlink(live = true) {
  const reducedMotion = useReducedMotion();
  const lid = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!live || reducedMotion) {
      lid.value = 0;
      return;
    }

    const runBlink = () => {
      lid.value = withSequence(
        withTiming(1, { duration: AVATAR_MOTION.blinkCloseMs }),
        withTiming(1, { duration: AVATAR_MOTION.blinkHoldMs }),
        withTiming(0, { duration: AVATAR_MOTION.blinkOpenMs }),
      );
    };

    const schedule = () => {
      timeoutRef.current = setTimeout(() => {
        runBlink();
        schedule();
      }, randomBlinkDelayMs());
    };

    schedule();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [live, reducedMotion, lid]);

  return lid;
}

export function BlinkingEye({ size, iris, lidColor = '#E8C8A8', live = true, lid }: BlinkingEyeProps) {
  const ownedLid = useAvatarBlink(live && !lid);
  const lidValue = lid ?? ownedLid;

  const w = Math.max(7, Math.round(size * 0.075));
  const h = Math.max(8, Math.round(size * 0.09));

  const lidStyle = useAnimatedStyle(() => ({
    height: lidValue.value * h * 0.54,
    opacity: lidValue.value > 0.04 ? 1 : 0,
  }));

  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.eye, { width: w, height: h, borderRadius: h * 0.42 }]}>
        <View
          style={[
            styles.iris,
            { width: w * 0.55, height: w * 0.55, borderRadius: w * 0.28, backgroundColor: iris },
          ]}
        >
          <View style={[styles.pupil, { width: w * 0.28, height: w * 0.28, borderRadius: w * 0.14 }]} />
        </View>
        <View
          style={[
            styles.highlight,
            {
              top: h * 0.18,
              right: w * 0.22,
              width: Math.max(2, w * 0.14),
              height: Math.max(2, w * 0.14),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.lid,
            {
              width: w + 2,
              borderBottomLeftRadius: w * 0.3,
              borderBottomRightRadius: w * 0.3,
              backgroundColor: lidColor,
              top: 0,
              left: -1,
            },
            lidStyle,
          ]}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eye: {
    backgroundColor: '#F8F6F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  iris: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    backgroundColor: '#1A1A22',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  lid: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
});
