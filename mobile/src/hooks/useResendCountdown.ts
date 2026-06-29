import { useCallback, useEffect, useState } from 'react';

/** Countdown timer for OTP resend (defaults to 30s). */
export function useResendCountdown(initialSeconds = 30) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemaining((value) => value - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining]);

  const reset = useCallback(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  return {
    remaining,
    canResend: remaining <= 0,
    reset,
  };
}
