/**
 * Performance budgets for heaviest screens (milliseconds).
 * Checked in __DEV__ via useScreenPerf and in CI via unit tests.
 */
export type ScreenPerfBudget = {
  /** Time from mount to first meaningful paint (data or skeleton ready) */
  firstContentfulMs: number;
  /** Time from mount to interactive (queries settled, no blocking spinners) */
  timeToInteractiveMs: number;
  /** Max re-renders allowed in first 3 seconds after mount */
  maxRendersIn3s: number;
  /** Max list items rendered without virtualization */
  maxUnvirtualizedListItems: number;
};

export const SCREEN_PERF_BUDGETS = {
  Home: {
    firstContentfulMs: 800,
    timeToInteractiveMs: 2000,
    maxRendersIn3s: 12,
    maxUnvirtualizedListItems: 20,
  },
  Quiz: {
    firstContentfulMs: 600,
    timeToInteractiveMs: 1200,
    maxRendersIn3s: 8,
    maxUnvirtualizedListItems: 6,
  },
  Analytics: {
    firstContentfulMs: 700,
    timeToInteractiveMs: 1800,
    maxRendersIn3s: 10,
    maxUnvirtualizedListItems: 15,
  },
} as const satisfies Record<string, ScreenPerfBudget>;

export type BudgetedScreen = keyof typeof SCREEN_PERF_BUDGETS;

export type PerfMeasurement = {
  screen: BudgetedScreen;
  firstContentfulMs?: number;
  timeToInteractiveMs?: number;
  renderCount: number;
};

export function checkPerfBudget(measurement: PerfMeasurement): {
  passed: boolean;
  violations: string[];
} {
  const budget = SCREEN_PERF_BUDGETS[measurement.screen];
  const violations: string[] = [];

  if (
    measurement.firstContentfulMs != null &&
    measurement.firstContentfulMs > budget.firstContentfulMs
  ) {
    violations.push(
      `firstContentfulMs ${measurement.firstContentfulMs} > ${budget.firstContentfulMs}`,
    );
  }

  if (
    measurement.timeToInteractiveMs != null &&
    measurement.timeToInteractiveMs > budget.timeToInteractiveMs
  ) {
    violations.push(
      `timeToInteractiveMs ${measurement.timeToInteractiveMs} > ${budget.timeToInteractiveMs}`,
    );
  }

  if (measurement.renderCount > budget.maxRendersIn3s) {
    violations.push(`renderCount ${measurement.renderCount} > ${budget.maxRendersIn3s}`);
  }

  return { passed: violations.length === 0, violations };
}

export function shouldVirtualizeList(itemCount: number, screen: BudgetedScreen): boolean {
  return itemCount > SCREEN_PERF_BUDGETS[screen].maxUnvirtualizedListItems;
}
