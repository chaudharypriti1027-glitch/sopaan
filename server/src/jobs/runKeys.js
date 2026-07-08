import { startOfDay } from '../utils/pagination.js';

export function dailyRunKey(date = new Date()) {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function weeklyRunKey(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + 3 - ((value.getDay() + 6) % 7));
  const weekOne = new Date(value.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((value.getTime() - weekOne.getTime()) / 86_400_000 -
        3 +
        ((weekOne.getDay() + 6) % 7)) /
        7,
    );

  return `${value.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/** ISO week key (YYYY-Www) → local [start, end) date range for analytics filters. */
export function weekKeyToRange(weekKey) {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(weekKey ?? '').trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return { start: weekStart, end: weekEnd };
}
