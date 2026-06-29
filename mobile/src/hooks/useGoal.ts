import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useGoalRoadmap(enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.goal(),
    queryFn: profileApi.getGoal,
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useRefreshGoalRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.getGoal,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.goal(), data);
    },
  });
}
