import { User } from '../models/User.js';
import {
  ACTIVITY_KINDS,
  computeActivityRewards,
  computeLeagueTier,
} from '../config/activityConfig.js';
import { logger } from '../observability/logger.js';
import { isSameIstDay, isYesterdayIst, startOfIstDay } from '../utils/date.js';
import { bustHomeFeedCache } from './home/buildHomeFeed.js';

/**
 * Apply IST streak rules for a meaningful activity.
 *
 * @returns {{ streakChanged: boolean, consumedFreeze: boolean, streak: object }}
 */
export function applyStreakUpdate(streak = {}, now = new Date()) {
  const lastActiveOn = streak.lastActiveOn ?? streak.lastActiveDate ?? null;

  if (lastActiveOn && isSameIstDay(lastActiveOn, now)) {
    return {
      streakChanged: false,
      consumedFreeze: false,
      streak: {
        current: streak.current ?? streak.count ?? 0,
        count: streak.current ?? streak.count ?? 0,
        best: streak.best ?? 0,
        freezes: streak.freezes ?? 0,
        lastActiveOn,
        lastActiveDate: lastActiveOn,
      },
    };
  }

  let current = streak.current ?? streak.count ?? 0;
  let best = streak.best ?? 0;
  let freezes = streak.freezes ?? 0;
  let consumedFreeze = false;

  if (!lastActiveOn) {
    current = 1;
  } else if (isYesterdayIst(lastActiveOn, now)) {
    current += 1;
  } else if (freezes > 0) {
    freezes -= 1;
    consumedFreeze = true;
  } else {
    current = 1;
  }

  if (current > best) {
    best = current;
  }

  const activeOn = startOfIstDay(now);

  return {
    streakChanged: true,
    consumedFreeze,
    streak: {
      current,
      count: current,
      best,
      freezes,
      lastActiveOn: activeOn,
      lastActiveDate: activeOn,
    },
  };
}

async function resolveUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user.save === 'function') {
    return user;
  }

  return User.findById(user._id ?? user);
}

/**
 * Record meaningful user activity: streak, XP, coins, and bust home cache.
 *
 * @param {object} user - User document or id
 * @param {string} kind - Activity kind (see ACTIVITY_KINDS)
 * @param {object} [context] - e.g. { score } for test_complete
 */
export async function recordActivity(user, kind, context = {}) {
  const doc = await resolveUser(user);

  if (!doc?._id) {
    logger.warn('[activity] recordActivity skipped — user not found', { kind });
    return null;
  }

  const userId = doc._id;
  const rewards = computeActivityRewards(kind, context);
  const { streakChanged, consumedFreeze, streak } = applyStreakUpdate(doc.streak ?? {}, new Date());

  doc.streak = streak;

  if (rewards.xp > 0) {
    doc.xp = (doc.xp ?? 0) + rewards.xp;
  }

  if (rewards.weeklyXp > 0) {
    doc.weeklyXp = (doc.weeklyXp ?? 0) + rewards.weeklyXp;
    doc.leagueTier = computeLeagueTier(doc.weeklyXp);
  }

  if (rewards.coins > 0) {
    doc.coins = (doc.coins ?? 0) + rewards.coins;
  }

  await doc.save();

  if (streakChanged) {
    const { awardBadge } = await import('./gamificationService.js');

    if (streak.current >= 3) {
      await awardBadge(userId, 'streak_3', '3-day streak!');
    }

    if (streak.current >= 7) {
      await awardBadge(userId, 'streak_7', '7-day streak!');
    }
  }

  await bustHomeFeedCache(userId);

  return {
    kind,
    streakChanged,
    consumedFreeze,
    streak: doc.streak,
    rewards,
    leagueTier: doc.leagueTier,
  };
}

export { ACTIVITY_KINDS };
