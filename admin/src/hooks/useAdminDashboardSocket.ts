import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onAdminDashboardCounters } from '../realtime/adminSocket';

export function useAdminDashboardSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAdminDashboardCounters((counters) => {
      queryClient.setQueryData(['admin', 'stats'], (current: Record<string, unknown> | undefined) => ({
        ...(current ?? {}),
        pendingReviews: counters.pendingReviews,
        pendingQuestionReviews: counters.pendingQuestionReviews,
        liveClasses: counters.liveClasses,
        assessedAt: counters.at,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}
