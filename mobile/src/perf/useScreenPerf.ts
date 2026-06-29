import { useEffect, useRef } from 'react';
import type { BudgetedScreen } from './budget';
import { assertPerfBudget, recordPerfMeasurement } from './metrics';

type UseScreenPerfOptions = {
  /** Call when primary content is visible (not full-screen loader) */
  isContentReady?: boolean;
  /** Call when screen is fully interactive */
  isInteractive?: boolean;
};

export function useScreenPerf(screen: BudgetedScreen, options: UseScreenPerfOptions = {}) {
  const { isContentReady = true, isInteractive = true } = options;
  const mountedAt = useRef(Date.now());
  const renderCount = useRef(0);
  const firstContentfulMs = useRef<number | undefined>(undefined);
  const timeToInteractiveMs = useRef<number | undefined>(undefined);

  renderCount.current += 1;

  useEffect(() => {
    mountedAt.current = Date.now();
    renderCount.current = 0;
    firstContentfulMs.current = undefined;
    timeToInteractiveMs.current = undefined;
  }, [screen]);

  useEffect(() => {
    if (isContentReady && firstContentfulMs.current == null) {
      firstContentfulMs.current = Date.now() - mountedAt.current;
    }
  }, [isContentReady]);

  useEffect(() => {
    if (isInteractive && timeToInteractiveMs.current == null) {
      timeToInteractiveMs.current = Date.now() - mountedAt.current;
    }
  }, [isInteractive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      recordPerfMeasurement({
        screen,
        firstContentfulMs: firstContentfulMs.current,
        timeToInteractiveMs: timeToInteractiveMs.current,
        renderCount: renderCount.current,
      });
      assertPerfBudget(screen);
    }, 3000);

    return () => clearTimeout(timer);
  }, [screen, isContentReady, isInteractive]);
}
