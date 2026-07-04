import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type GenerateExamInput , PaginationParams } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useAdminStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: adminApi.getStats,
    enabled: false,
  });
}

export function usePendingTests(params?: PaginationParams) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.admin.pendingTests(params),
    queryFn: () => adminApi.listPendingTests(params),
    enabled: false,
  });
}

export function useReviewTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) =>
      adminApi.reviewTest(id, decision),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useGenerateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateExamInput) => adminApi.generateExam(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}
