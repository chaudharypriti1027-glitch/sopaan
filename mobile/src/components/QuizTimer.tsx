import { memo, useEffect, useRef, useState } from 'react';
import { TimerRing } from './TimerRing';

type QuizTimerProps = {
  totalSec: number;
  onExpire: () => void;
};

/** Isolated timer state so the quiz body does not re-render every second. */
export const QuizTimer = memo(function QuizTimer({ totalSec, onExpire }: QuizTimerProps) {
  const [remainingSec, setRemainingSec] = useState(totalSec);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!totalSec) {
      return;
    }

    setRemainingSec(totalSec);
    const startedAt = Date.now();
    const endAt = startedAt + totalSec * 1000;

    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSec(next);

      if (next <= 0) {
        clearInterval(timerId);
        onExpireRef.current();
      }
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [totalSec]);

  return <TimerRing totalSec={totalSec} remainingSec={remainingSec} />;
});
