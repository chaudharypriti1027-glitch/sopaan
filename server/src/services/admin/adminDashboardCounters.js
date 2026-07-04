import { Test } from '../../models/Test.js';
import { countPendingQuestionReviews } from './adminQuestionService.js';
import { countActiveLiveClasses } from '../liveClassService.js';

export async function getAdminDashboardCounters() {
  const [pendingReviews, pendingQuestionReviews, liveClasses] = await Promise.all([
    Test.countDocuments({ status: 'pending_review' }),
    countPendingQuestionReviews(),
    countActiveLiveClasses(),
  ]);

  return {
    pendingReviews,
    pendingQuestionReviews,
    liveClasses,
    at: new Date().toISOString(),
  };
}
