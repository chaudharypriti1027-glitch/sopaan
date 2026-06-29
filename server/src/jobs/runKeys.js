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
