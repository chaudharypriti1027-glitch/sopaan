import type { BudgetedScreen, PerfMeasurement } from './budget';
import { checkPerfBudget } from './budget';

const measurements = new Map<BudgetedScreen, PerfMeasurement>();

export function recordPerfMeasurement(measurement: PerfMeasurement): void {
  measurements.set(measurement.screen, measurement);
}

export function getPerfMeasurement(screen: BudgetedScreen): PerfMeasurement | undefined {
  return measurements.get(screen);
}

export function clearPerfMeasurements(): void {
  measurements.clear();
}

export function assertPerfBudget(screen: BudgetedScreen): void {
  const measurement = measurements.get(screen);

  if (!measurement) {
    return;
  }

  const { passed, violations } = checkPerfBudget(measurement);

  if (!passed && __DEV__) {
    console.warn(`[perf] ${screen} budget exceeded:`, violations.join('; '));
  }
}
