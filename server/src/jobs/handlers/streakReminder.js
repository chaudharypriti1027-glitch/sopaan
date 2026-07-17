import { User } from '../../models/User.js';
import { Notification } from '../../models/Notification.js';
import { startOfDay } from '../../utils/pagination.js';
import {
  dispatchNotification,
  NOTIFICATION_TYPES,
} from '../../services/notificationService.js';
import { runIdempotentJob } from '../jobRunner.js';
import { dailyRunKey } from '../runKeys.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

export async function sendStreakReminders() {
  const today = startOfDay(new Date());
  const users = await User.find({
    role: 'student',
    'streak.count': { $gte: 1 },
    $or: [{ 'streak.lastActiveDate': { $lt: today } }, { 'streak.lastActiveDate': null }],
  })
    .select('_id streak')
    .limit(500)
    .lean();

  let sent = 0;
  let skipped = 0;

  // One query for everyone already reminded today instead of one per user.
  const remindedDocs = await Notification.find({
    userId: { $in: users.map((user) => user._id) },
    type: NOTIFICATION_TYPES.STREAK_REMINDER,
    createdAt: { $gte: today },
  })
    .select('userId')
    .lean();
  const remindedIds = new Set(remindedDocs.map((doc) => doc.userId.toString()));

  for (const user of users) {
    if (remindedIds.has(user._id.toString())) {
      skipped += 1;
      continue;
    }

    const streakCount = user.streak?.count ?? 0;
    const result = await dispatchNotification(user._id, {
      type: NOTIFICATION_TYPES.STREAK_REMINDER,
      title: 'Keep your streak alive',
      body: `You have a ${streakCount}-day streak. Study today to keep it going.`,
      data: { streakCount },
    });

    if (result.push?.sent || result.notification) {
      sent += 1;
    }
  }

  return { sent, skipped, candidates: users.length };
}

export async function runStreakReminderJob({ force = false, date, triggeredBy = 'scheduler' } = {}) {
  const runKey = dailyRunKey(date ?? new Date());

  return runIdempotentJob({
    jobName: JOB_NAMES.STREAK_REMINDER,
    runKey,
    force,
    triggeredBy,
    handler: sendStreakReminders,
  });
}
