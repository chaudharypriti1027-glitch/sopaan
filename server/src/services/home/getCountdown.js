import { Goal } from '../../models/Goal.js';
import { daysUntilIst, formatIstLongDateLabel } from '../../utils/date.js';
import { safeHomeCall } from './safe.js';

export function buildCountdownFromGoal(goal, now = new Date()) {
  if (!goal?.examDate) {
    return null;
  }

  const daysLeft = daysUntilIst(goal.examDate, now);

  return {
    examName: goal.examName ?? 'Your exam',
    daysLeft: Math.max(0, daysLeft),
    dateLabel: formatIstLongDateLabel(goal.examDate),
  };
}

export async function getCountdown(user) {
  return safeHomeCall('getCountdown', async () => {
    if (!user?.activeGoalId) {
      return null;
    }

    const goal = await Goal.findById(user.activeGoalId).lean();
    return buildCountdownFromGoal(goal);
  }, null);
}
