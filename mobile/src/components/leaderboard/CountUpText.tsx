import { useEffect, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

type CountUpTextProps = {
  value: number;
  suffix?: string;
  style?: TextStyle;
  duration?: number;
  delay?: number;
};

/** Count-up animation matching the premium HTML reference. */
export function CountUpText({
  value,
  suffix = '',
  style,
  duration = 1200,
  delay = 350,
}: CountUpTextProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = (now: number) => {
      if (!start) {
        start = now;
      }
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(value * eased));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    timeout = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [delay, duration, value]);

  return (
    <Text style={style}>
      {display.toLocaleString()}
      {suffix}
    </Text>
  );
}
