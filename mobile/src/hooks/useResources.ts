import { useQuery } from '@tanstack/react-query';
import { analyticsApi, resourcesApi, type AnalyticsRange, type PaginationParams } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useAnalyticsProgress(range: AnalyticsRange = 'week', enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.analytics.progress(range),
    queryFn: () => analyticsApi.getProgressAnalytics(range),
    enabled: isAuthenticated && enabled,
  });
}

export function useRewards(params?: PaginationParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.rewards.list(params),
    queryFn: () => resourcesApi.listRewards(params),
    enabled: isAuthenticated,
  });
}
