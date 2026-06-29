import { Notification } from '../../models/Notification.js';
import { TestSeries } from '../../models/TestSeries.js';
import { User } from '../../models/User.js';
import { getProgressAnalytics } from '../../services/analyticsService.js';
import {
  dispatchNotification,
  NOTIFICATION_TYPES,
} from '../../services/notificationService.js';
import { runIdempotentJob } from '../jobRunner.js';
import { weeklyRunKey } from '../runKeys.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

export async function checkLiveMockNotifications() {
  const seriesList = await TestSeries.find({ 'mocks.isLive': true }).lean();
  let sent = 0;
  let skipped = 0;

  for (const series of seriesList) {
    const enrolled = series.enrolledUsers ?? [];

    if (!enrolled.length) {
      continue;
    }

    for (const mock of series.mocks ?? []) {
      if (!mock.isLive) {
        continue;
      }

      const mockKey = `${series._id}:${mock.testId}`;

      for (const userId of enrolled) {
        const existing = await Notification.findOne({
          userId,
          type: NOTIFICATION_TYPES.MOCK_LIVE,
          'data.mockKey': mockKey,
        }).lean();

        if (existing) {
          skipped += 1;
          continue;
        }

        const result = await dispatchNotification(userId, {
          type: NOTIFICATION_TYPES.MOCK_LIVE,
          title: 'Mock test is live',
          body: `${series.title}: Live mock is available now.`,
          data: { mockKey, seriesId: series._id.toString(), mockTitle: 'Live mock' },
        });

        if (result.push?.sent || result.notification) {
          sent += 1;
        }
      }
    }
  }

  return { sent, skipped };
}

export async function sendWeeklyProgressRecaps(weekKey) {
  const users = await User.find({ role: 'student' }).select('_id').limit(500).lean();

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const alreadySent = await Notification.findOne({
      userId: user._id,
      type: NOTIFICATION_TYPES.PROGRESS_RECAP,
      'data.weekKey': weekKey,
    }).lean();

    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const analytics = await getProgressAnalytics(user._id, 'week');
    const { totalAttempts, avgAccuracy, totalStudyHours } = analytics.summary;

    if (totalAttempts === 0 && totalStudyHours === 0) {
      skipped += 1;
      continue;
    }

    const body = `${totalAttempts} mock${totalAttempts === 1 ? '' : 's'}, ${avgAccuracy}% avg accuracy, ${totalStudyHours}h studied this week.`;
    const result = await dispatchNotification(user._id, {
      type: NOTIFICATION_TYPES.PROGRESS_RECAP,
      title: 'Your weekly progress recap',
      body,
      data: { weekKey, totalAttempts, avgAccuracy, totalStudyHours },
    });

    if (result.push?.sent || result.notification) {
      sent += 1;
    }
  }

  return { sent, skipped, candidates: users.length };
}

export async function runWeeklyRecapJob({ force = false, date, triggeredBy = 'scheduler' } = {}) {
  const runKey = weeklyRunKey(date ?? new Date());

  return runIdempotentJob({
    jobName: JOB_NAMES.WEEKLY_RECAP,
    runKey,
    force,
    triggeredBy,
    handler: async () => {
      const mockLive = await checkLiveMockNotifications();
      const progressRecap = await sendWeeklyProgressRecaps(runKey);

      return {
        weekKey: runKey,
        mockLive,
        progressRecap,
      };
    },
  });
}
