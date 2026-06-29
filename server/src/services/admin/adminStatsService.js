import { User } from '../../models/User.js';
import { Test } from '../../models/Test.js';
import { Attempt } from '../../models/Attempt.js';
import { FocusLog } from '../../models/FocusLog.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { countPendingQuestionReviews } from './adminQuestionService.js';
import { countActiveLiveClasses } from '../liveClassService.js';

export async function getAdminStats() {
  const since = subtractDays(new Date(), 30);

  const [
    activeAttemptUsers,
    activeFocusUsers,
    testsPublished,
    liveClasses,
    pendingReviews,
    pendingQuestionReviews,
    totalStudents,
  ] = await Promise.all([
    Attempt.distinct('userId', { createdAt: { $gte: since } }),
    FocusLog.distinct('userId', { date: { $gte: since } }),
    Test.countDocuments({ status: 'published' }),
    countActiveLiveClasses(),
    Test.countDocuments({ status: 'pending_review' }),
    countPendingQuestionReviews(),
    User.countDocuments({ role: 'student' }),
  ]);

  const activeIds = new Set([
    ...activeAttemptUsers.map((id) => id.toString()),
    ...activeFocusUsers.map((id) => id.toString()),
  ]);

  const activeStudents = await User.countDocuments({
    role: 'student',
    _id: { $in: [...activeIds] },
  });

  return {
    activeStudents,
    totalStudents,
    testsPublished,
    liveClasses,
    pendingReviews,
    pendingQuestionReviews,
    assessedAt: new Date().toISOString(),
  };
}
