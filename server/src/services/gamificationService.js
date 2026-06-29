import { User } from '../models/User.js';
import { Badge } from '../models/Badge.js';
import { createNotification } from './notificationService.js';
import { recordActivity, ACTIVITY_KINDS } from './activity.js';

export async function awardCoins(userId, amount) {
  if (amount <= 0) {
    return 0;
  }

  await User.findByIdAndUpdate(userId, { $inc: { coins: amount } });
  return amount;
}

export async function awardBadge(userId, key, title) {
  try {
    await Badge.create({ userId, key });
    await createNotification(userId, {
      type: 'badge',
      title: title ?? `Badge earned: ${key}`,
      body: `You unlocked the ${key} badge.`,
    });
    return true;
  } catch (err) {
    if (err?.code === 11000) {
      return false;
    }
    throw err;
  }
}

/** @deprecated Use recordActivity from activity.js */
export async function updateStreak(userId) {
  const user = await User.findById(userId);
  const result = await recordActivity(user, ACTIVITY_KINDS.DAILY_LOGIN);
  return result?.streak ?? user?.streak;
}

export async function handleAttemptRewards(userId, attempt) {
  await awardBadge(userId, 'first_attempt', 'First mock completed!');

  if (attempt.accuracy === 100) {
    await awardBadge(userId, 'perfect_score', 'Perfect score!');
  }

  return { badgesOnly: true };
}

export async function handleFocusRewards(userId, sessionsCompleted) {
  if (sessionsCompleted <= 0) {
    return { coinsAwarded: 0, streak: null };
  }

  const user = await User.findById(userId);
  const result = await recordActivity(user, ACTIVITY_KINDS.FOCUS_SESSION);

  return {
    coinsAwarded: result?.rewards?.coins ?? 0,
    streak: result?.streak ?? null,
  };
}
