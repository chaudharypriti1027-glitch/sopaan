import { describe, expect, it } from '@jest/globals';
import { applyStreakUpdate } from '../src/services/activity.js';
import { computeActivityRewards, computeLeagueTier } from '../src/config/activityConfig.js';
import { startOfIstDay } from '../src/utils/date.js';

describe('applyStreakUpdate', () => {
  const now = new Date('2026-06-26T06:00:00.000Z');

  it('no-ops when lastActiveOn is today in IST', () => {
    const today = startOfIstDay(now);
    const result = applyStreakUpdate(
      { current: 4, best: 4, freezes: 1, lastActiveOn: today },
      now,
    );

    expect(result.streakChanged).toBe(false);
    expect(result.streak.current).toBe(4);
    expect(result.streak.freezes).toBe(1);
  });

  it('increments when lastActiveOn was yesterday in IST', () => {
    const yesterday = new Date(startOfIstDay(now).getTime() - 24 * 60 * 60 * 1000);
    const result = applyStreakUpdate(
      { current: 3, best: 5, freezes: 0, lastActiveOn: yesterday },
      now,
    );

    expect(result.streakChanged).toBe(true);
    expect(result.streak.current).toBe(4);
    expect(result.streak.best).toBe(5);
  });

  it('consumes a freeze and keeps streak after a gap', () => {
    const threeDaysAgo = new Date(startOfIstDay(now).getTime() - 3 * 24 * 60 * 60 * 1000);
    const result = applyStreakUpdate(
      { current: 6, best: 6, freezes: 2, lastActiveOn: threeDaysAgo },
      now,
    );

    expect(result.consumedFreeze).toBe(true);
    expect(result.streak.current).toBe(6);
    expect(result.streak.freezes).toBe(1);
  });

  it('resets streak to 1 when gap exceeds one day and no freeze', () => {
    const threeDaysAgo = new Date(startOfIstDay(now).getTime() - 3 * 24 * 60 * 60 * 1000);
    const result = applyStreakUpdate(
      { current: 6, best: 6, freezes: 0, lastActiveOn: threeDaysAgo },
      now,
    );

    expect(result.streak.current).toBe(1);
    expect(result.streak.best).toBe(6);
  });
});

describe('activity rewards', () => {
  it('scales test_complete coins with score', () => {
    expect(computeActivityRewards('test_complete', { score: 8 })).toEqual({
      xp: 36,
      weeklyXp: 36,
      coins: 50,
    });
  });

  it('scales game_complete coins with score', () => {
    expect(computeActivityRewards('game_complete', { score: 80 })).toEqual({
      xp: 16,
      weeklyXp: 16,
      coins: 13,
    });
  });

  it('maps weekly XP to league tiers', () => {
    expect(computeLeagueTier(600)).toBe('Gold');
    expect(computeLeagueTier(120)).toBe('Bronze');
    expect(computeLeagueTier(10)).toBe('Rookie');
  });
});
