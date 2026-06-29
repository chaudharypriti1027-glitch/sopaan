import { describe, expect, it } from '@jest/globals';
import { buildMonthFilterOptions, currentMonthKey } from '../monthFilter';

describe('monthFilter', () => {
  it('returns recent months only (no all)', () => {
    const options = buildMonthFilterOptions(3);
    expect(options).toHaveLength(3);
    expect(options[0].value).toMatch(/^\d{4}-\d{2}$/);
    expect(options.some((item) => item.value === 'all')).toBe(false);
  });

  it('currentMonthKey returns YYYY-MM', () => {
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}$/);
  });
});
