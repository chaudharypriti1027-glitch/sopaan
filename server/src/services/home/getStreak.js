import { isSameIstDay } from '../../utils/date.js';
import { safeHomeCall } from './safe.js';

const STREAK_FALLBACK = {
  current: 0,
  best: 0,
  freezes: 0,
  todayDone: false,
};

export function buildStreakFromUser(user, now = new Date()) {
  const streak = user?.streak ?? {};
  const current = streak.current ?? streak.count ?? 0;
  const best = Math.max(streak.best ?? 0, current);
  const freezes = streak.freezes ?? 0;
  const lastActiveOn = streak.lastActiveOn ?? streak.lastActiveDate ?? null;
  const todayDone = lastActiveOn ? isSameIstDay(lastActiveOn, now) : false;

  return { current, best, freezes, todayDone };
}

export async function getStreak(user) {
  return safeHomeCall('getStreak', async () => buildStreakFromUser(user), STREAK_FALLBACK);
}
