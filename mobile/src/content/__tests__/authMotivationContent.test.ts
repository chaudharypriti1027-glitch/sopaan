import {
  AUTH_MOTIVATION_COUNT,
  nextMotivationIndex,
  pickMotivationIndex,
} from '../authMotivationContent';

describe('authMotivationContent', () => {
  it('cycles through six motivation lines', () => {
    expect(AUTH_MOTIVATION_COUNT).toBe(6);
    expect(pickMotivationIndex('login')).toBeGreaterThanOrEqual(0);
    expect(pickMotivationIndex('login')).toBeLessThan(AUTH_MOTIVATION_COUNT);
    expect(nextMotivationIndex(5)).toBe(0);
    expect(nextMotivationIndex(2)).toBe(3);
  });
});
