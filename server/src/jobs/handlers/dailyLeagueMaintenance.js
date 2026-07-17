import { User } from '../../models/User.js';
import { computeLeagueTier } from '../../config/activityConfig.js';
import { isMondayIst, startOfIstDay, yesterdayStartIst } from '../../utils/date.js';
import { runIdempotentJob } from '../jobRunner.js';
import { dailyRunKey } from '../runKeys.js';
import { JOB_NAMES } from '../../config/jobConfig.js';
import { bustHomeFeedCache } from '../../services/home/buildHomeFeed.js';

function missedYesterday(lastActiveOn, yesterdayStart) {
  if (!lastActiveOn) {
    return true;
  }

  return startOfIstDay(lastActiveOn).getTime() < yesterdayStart.getTime();
}

/**
 * 00:05 IST — break streaks for users who missed yesterday without a freeze;
 * on Mondays reset their weeklyXp; recompute leagueTier for that cohort.
 */
export async function runDailyLeagueMaintenance() {
  const now = new Date();
  const yesterdayStart = yesterdayStartIst(now);
  const isMonday = isMondayIst(now);

  const users = await User.find({
    role: 'student',
    accountStatus: 'active',
    $or: [{ 'streak.freezes': { $lte: 0 } }, { 'streak.freezes': null }],
  })
    .select('_id weeklyXp streak')
    .lean();

  let streakBroken = 0;
  let weeklyReset = 0;
  let tierUpdated = 0;

  const bulkOps = [];
  const affectedUserIds = [];

  for (const user of users) {
    const lastActive = user.streak?.lastActiveOn ?? user.streak?.lastActiveDate ?? null;

    if (!missedYesterday(lastActive, yesterdayStart)) {
      continue;
    }

    const weeklyXp = user.weeklyXp ?? 0;
    const update = {
      'streak.current': 0,
      'streak.count': 0,
      leagueTier: computeLeagueTier(weeklyXp),
    };

    if (isMonday) {
      update.weeklyXp = 0;
      weeklyReset += 1;
    }

    bulkOps.push({ updateOne: { filter: { _id: user._id }, update: { $set: update } } });
    affectedUserIds.push(user._id);

    streakBroken += 1;
    tierUpdated += 1;
  }

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps, { ordered: false });
    await Promise.allSettled(affectedUserIds.map((id) => bustHomeFeedCache(id)));
  }

  return {
    candidates: users.length,
    streakBroken,
    weeklyReset,
    tierUpdated,
    isMonday,
  };
}

export async function runDailyLeagueMaintenanceJob({
  force = false,
  date,
  triggeredBy = 'scheduler',
} = {}) {
  const runKey = dailyRunKey(date ?? new Date());

  return runIdempotentJob({
    jobName: JOB_NAMES.DAILY_LEAGUE_MAINTENANCE,
    runKey,
    force,
    triggeredBy,
    handler: runDailyLeagueMaintenance,
  });
}
