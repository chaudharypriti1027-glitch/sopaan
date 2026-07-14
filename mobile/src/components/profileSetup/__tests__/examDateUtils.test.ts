import { describe, expect, it } from '@jest/globals';
import {
  parseExamDate,
  toExamDatePayload,
} from '../examDateUtils';

describe('examDateUtils', () => {
  it('parses YYYY-MM-DD as a local calendar date', () => {
    const date = parseExamDate('2026-07-09');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(9);
  });

  it('serializes dates without UTC day shift', () => {
    const date = new Date(2026, 6, 9, 12, 0, 0, 0);
    expect(toExamDatePayload(date)).toBe('2026-07-09');
  });
});
