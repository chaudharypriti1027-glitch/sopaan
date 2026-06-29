import { describe, expect, it } from '@jest/globals';
import { buildStreakFromUser } from '../src/services/home/getStreak.js';
import { startOfIstDay } from '../src/utils/date.js';

describe('getStreak', () => {
  it('maps streak fields and marks todayDone when lastActiveOn is today in IST', () => {
    const now = new Date('2026-06-26T06:00:00.000Z');
    const user = {
      streak: {
        current: 5,
        best: 10,
        freezes: 2,
        lastActiveOn: startOfIstDay(now),
      },
    };

    expect(buildStreakFromUser(user, now)).toEqual({
      current: 5,
      best: 10,
      freezes: 2,
      todayDone: true,
    });
  });

  it('falls back to legacy count and lastActiveDate', () => {
    const now = new Date('2026-06-26T06:00:00.000Z');
    const yesterday = new Date(startOfIstDay(now).getTime() - 24 * 60 * 60 * 1000);

    const user = {
      streak: {
        count: 3,
        lastActiveDate: yesterday,
      },
    };

    expect(buildStreakFromUser(user, now)).toEqual({
      current: 3,
      best: 3,
      freezes: 0,
      todayDone: false,
    });
  });

  it('uses best of best and current when best is lower than current', () => {
    const user = {
      streak: {
        current: 8,
        best: 5,
        lastActiveOn: null,
      },
    };

    expect(buildStreakFromUser(user)).toEqual({
      current: 8,
      best: 8,
      freezes: 0,
      todayDone: false,
    });
  });
});
