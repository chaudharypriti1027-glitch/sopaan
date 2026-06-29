import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { testsApi, type ListTestsParams, type SubmitTestInput } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useTests(params?: ListTestsParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.tests.list(params),
    queryFn: () => testsApi.listTests(params),
    enabled: isAuthenticated,
  });
}

export function useTest(id: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.tests.detail(id ?? ''),
    queryFn: () => testsApi.getTest(id!),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useSubmitTest(testId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitTestInput) => testsApi.submitTest(testId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attempts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(testId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}
