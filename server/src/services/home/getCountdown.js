import { Goal } from '../../models/Goal.js';
import { getOrCreateProfile } from '../profileService.js';
import { daysUntilIst, formatIstLongDateLabel } from '../../utils/date.js';
import { normalizeExamTrack } from '../../utils/examTrack.js';
import { resolveExamTrackForUser } from '../../utils/resolveExamTrackForUser.js';
import { safeHomeCall } from './safe.js';

export function buildCountdownFromGoal(goal, now = new Date()) {
  if (!goal?.examDate) {
    return null;
  }

  const daysLeft = daysUntilIst(goal.examDate, now);
  const examName =
    normalizeExamTrack(goal.examName) || goal.examName?.trim() || 'Your exam';

  return {
    examName,
    daysLeft: Math.max(0, daysLeft),
    dateLabel: formatIstLongDateLabel(goal.examDate),
  };
}

export async function getCountdown(user) {
  return safeHomeCall('getCountdown', async () => {
    const profile = user?._id ? await getOrCreateProfile(user._id) : null;

    if (user?.activeGoalId) {
      const goal = await Goal.findById(user.activeGoalId).lean();
      const fromGoal = buildCountdownFromGoal(goal);

      if (fromGoal) {
        return fromGoal;
      }
    }

    const examTrack = resolveExamTrackForUser(user, profile);

    if (user?.examDate && examTrack) {
      return buildCountdownFromGoal({
        examName: examTrack,
        examDate: user.examDate,
      });
    }

    return null;
  }, null);
}
