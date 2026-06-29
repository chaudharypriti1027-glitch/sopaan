import {
  SCREEN_PERF_BUDGETS,
  checkPerfBudget,
  shouldVirtualizeList,
} from '../budget';

describe('perf budget', () => {
  it('defines budgets for Home, Quiz, and Analytics', () => {
    expect(SCREEN_PERF_BUDGETS.Home.firstContentfulMs).toBeLessThanOrEqual(1000);
    expect(SCREEN_PERF_BUDGETS.Quiz.timeToInteractiveMs).toBeLessThanOrEqual(1500);
    expect(SCREEN_PERF_BUDGETS.Analytics.maxRendersIn3s).toBeGreaterThan(0);
  });

  it('passes when measurements are within budget', () => {
    const result = checkPerfBudget({
      screen: 'Home',
      firstContentfulMs: 400,
      timeToInteractiveMs: 900,
      renderCount: 5,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('flags violations when measurements exceed budget', () => {
    const result = checkPerfBudget({
      screen: 'Quiz',
      firstContentfulMs: 2000,
      timeToInteractiveMs: 5000,
      renderCount: 50,
    });

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('requires virtualization for long lists', () => {
    expect(shouldVirtualizeList(50, 'Home')).toBe(true);
    expect(shouldVirtualizeList(5, 'Quiz')).toBe(false);
  });
});
