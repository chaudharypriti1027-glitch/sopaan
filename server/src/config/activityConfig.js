/** Reward amounts per meaningful activity kind. */

export const ACTIVITY_KINDS = Object.freeze({
  TEST_COMPLETE: 'test_complete',
  LESSON_COMPLETE: 'lesson_complete',
  DAILY_LOGIN: 'daily_login',
  FOCUS_SESSION: 'focus_session',
  GAME_COMPLETE: 'game_complete',
});

export const ACTIVITY_REWARDS = Object.freeze({
  [ACTIVITY_KINDS.TEST_COMPLETE]: {
    xp: 20,
    weeklyXp: 20,
    coinsBase: 10,
    coinsPerScore: 5,
  },
  [ACTIVITY_KINDS.LESSON_COMPLETE]: {
    xp: 15,
    weeklyXp: 15,
    coins: 5,
  },
  [ACTIVITY_KINDS.DAILY_LOGIN]: {
    xp: 5,
    weeklyXp: 5,
    coins: 2,
  },
  [ACTIVITY_KINDS.FOCUS_SESSION]: {
    xp: 10,
    weeklyXp: 10,
    coins: 5,
  },
  [ACTIVITY_KINDS.GAME_COMPLETE]: {
    xp: 8,
    weeklyXp: 8,
    coinsBase: 5,
    coinsPerScore: 1,
  },
});

export const LEAGUE_TIER_THRESHOLDS = Object.freeze([
  { tier: 'Gold', minWeeklyXp: 500 },
  { tier: 'Silver', minWeeklyXp: 250 },
  { tier: 'Bronze', minWeeklyXp: 100 },
  { tier: 'Rookie', minWeeklyXp: 0 },
]);

export function computeLeagueTier(weeklyXp) {
  const xp = weeklyXp ?? 0;

  for (const { tier, minWeeklyXp } of LEAGUE_TIER_THRESHOLDS) {
    if (xp >= minWeeklyXp) {
      return tier;
    }
  }

  return 'Rookie';
}

export function computeActivityRewards(kind, context = {}) {
  const config = ACTIVITY_REWARDS[kind];

  if (!config) {
    return { xp: 0, weeklyXp: 0, coins: 0 };
  }

  if (kind === ACTIVITY_KINDS.TEST_COMPLETE) {
    const score = context.score ?? 0;

    return {
      xp: config.xp + score * 2,
      weeklyXp: config.weeklyXp + score * 2,
      coins: config.coinsBase + score * (config.coinsPerScore ?? 5),
    };
  }

  if (kind === ACTIVITY_KINDS.GAME_COMPLETE) {
    const score = context.score ?? 0;

    return {
      xp: config.xp + Math.floor(score / 10),
      weeklyXp: config.weeklyXp + Math.floor(score / 10),
      coins: config.coinsBase + Math.floor(score / 10) * (config.coinsPerScore ?? 1),
    };
  }

  return {
    xp: config.xp ?? 0,
    weeklyXp: config.weeklyXp ?? 0,
    coins: config.coins ?? 0,
  };
}
