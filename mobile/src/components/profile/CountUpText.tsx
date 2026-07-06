import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { NumText } from '../NumText';
import { PROFILE_MOTION } from './profileMotion';

type CountUpTextProps = {
  value: number | null | undefined;
  replayKey: number;
  suffix?: string;
  fallback?: string;
  style?: StyleProp<TextStyle>;
};

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

const skipCountAnimation =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export function CountUpText({
  value,
  replayKey,
  suffix = '',
  fallback = '—',
  style,
}: CountUpTextProps) {
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion || skipCountAnimation;
  const target = value ?? null;
  const [display, setDisplay] = useState(() =>
    skipAnimation || target == null ? (target == null ? fallback : `${target}${suffix}`) : `0${suffix}`,
  );

  useEffect(() => {
    if (target == null) {
      setDisplay(fallback);
      return;
    }

    if (skipAnimation) {
      setDisplay(`${target}${suffix}`);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = PROFILE_MOTION.countUpDurationMs;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(`${Math.round(target * eased)}${suffix}`);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setDisplay(`0${suffix}`);
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, replayKey, suffix, fallback, skipAnimation]);

  const text = useMemo(() => display, [display]);

  return <NumText style={style}>{text}</NumText>;
}
