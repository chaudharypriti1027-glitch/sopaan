import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getHomeFeed, refreshHomeFeed } from '../api/home';
import { useAuth } from '../auth';
import type { HomeFeed } from '../types/home';
import { queryKeys } from './queryKeys';

export function useHomeFeed() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.home.feed(),
    queryFn: async () => {
      const cached = queryClient.getQueryData<HomeFeed>(queryKeys.home.feed());
      const etag = cached?.generatedAt ? `"${cached.generatedAt}"` : undefined;
      const feed = await getHomeFeed(etag ? { ifNoneMatch: etag } : undefined);
      return feed ?? cached!;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnMount: 'always',
    /** Keep showing the last good feed when a background refetch fails (offline). */
    throwOnError: false,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshHomeFeed,
    onSuccess: (feed) => {
      queryClient.setQueryData<HomeFeed>(queryKeys.home.feed(), feed);
    },
  });

  const refetch = useCallback(async () => {
    return refreshMutation.mutateAsync();
  }, [refreshMutation]);

  const hasCachedFeed = Boolean(query.data);
  const fetchFailed = query.error != null;

  return {
    data: query.data,
    /** False when persisted or in-memory cache can render immediately. */
    isLoading: query.isLoading && !query.data,
    isError: query.isError && !query.data,
    /** Fetch failed but a previously saved feed is still available. */
    isOffline: hasCachedFeed && fetchFailed,
    refetch,
    isRefetching: refreshMutation.isPending,
  };
}
