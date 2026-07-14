import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examPlanApi } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useExamPlan(enabled = true) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.examPlan.detail(),
    queryFn: examPlanApi.getExamPlan,
    enabled: isAuthenticated && enabled,
    retry: 1,
    refetchOnMount: 'always',
    staleTime: 30_000,
  });
}

export function useRefreshExamPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: examPlanApi.getExamPlan,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.examPlan.detail(), data);
    },
  });
}
