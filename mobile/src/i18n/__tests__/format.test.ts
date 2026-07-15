import { describe, expect, it } from '@jest/globals';
import {
  INVALID_DATE_FALLBACK,
  formatDate,
  parseDate,
} from '../format';

describe('parseDate', () => {
  it('returns null for empty / invalid inputs', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('null')).toBeNull();
    expect(parseDate('undefined')).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate(Number.NaN)).toBeNull();
    expect(parseDate(new Date('invalid'))).toBeNull();
  });

  it('parses ISO strings', () => {
    const date = parseDate('2026-12-31T00:00:00.000Z');
    expect(date).not.toBeNull();
    expect(date?.toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });

  it('normalizes unix seconds and millisecond epochs', () => {
    const seconds = 1_735_603_200; // 2024-12-31T00:00:00.000Z
    const fromSeconds = parseDate(seconds);
    const fromMs = parseDate(seconds * 1000);
    const fromSecondsString = parseDate(String(seconds));
    const fromMsString = parseDate(String(seconds * 1000));

    expect(fromSeconds?.toISOString()).toBe('2024-12-31T00:00:00.000Z');
    expect(fromMs?.toISOString()).toBe('2024-12-31T00:00:00.000Z');
    expect(fromSecondsString?.toISOString()).toBe('2024-12-31T00:00:00.000Z');
    expect(fromMsString?.toISOString()).toBe('2024-12-31T00:00:00.000Z');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO subscription expiry', () => {
    expect(
      formatDate('2026-12-31T00:00:00.000Z', 'en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    ).toBe('31 Dec 2026');
  });

  it('returns fallback instead of throwing for invalid dates', () => {
    expect(formatDate('invalid', 'en')).toBe(INVALID_DATE_FALLBACK);
    expect(formatDate(null, 'en')).toBe(INVALID_DATE_FALLBACK);
    expect(formatDate('', 'hi')).toBe(INVALID_DATE_FALLBACK);
    expect(formatDate('1735603200000', 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })).toBe('31 Dec 2024');
  });
});
