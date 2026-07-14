import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi, type UpdateGoalInput, type UpdateProfileInput } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: profileApi.getProfile,
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.updateProfile(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.me(), data);
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGoalInput) => profileApi.updateGoal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.examPlan.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });
}

export function useReadiness(enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.readiness(),
    queryFn: profileApi.getReadiness,
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}
