import { useEffect, useState } from 'react';

export type LiveClassCountdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
  hasTarget: boolean;
};

export function useLiveClassCountdown(targetIso?: string): LiveClassCountdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  if (!targetIso) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isPast: false,
      hasTarget: false,
    };
  }

  const targetMs = new Date(targetIso).getTime();
  const diff = Math.max(0, targetMs - now);

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    totalMs: diff,
    isPast: diff === 0 && now >= targetMs,
    hasTarget: true,
  };
}
