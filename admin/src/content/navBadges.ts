import type { AdminStats } from '../api/types';

/** Format sidebar badge counts from dashboard stats. */
export function formatNavBadge(count: number | undefined): string | undefined {
  if (!count || count <= 0) return undefined;
  return count > 99 ? '99+' : String(count);
}

export function navBadgesFromStats(stats: AdminStats | undefined) {
  return {
    questions: undefined,
    review: formatNavBadge(stats?.pendingQuestionReviews),
    tests: formatNavBadge(stats?.pendingReviews),
    aifeedback: formatNavBadge(stats?.aiFeedbackPending),
  } as const;
}
