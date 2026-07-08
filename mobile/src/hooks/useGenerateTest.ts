import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi, type GenerateTestInput } from '../api';
import { queryKeys } from './queryKeys';

export function useGenerateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateTestInput) => aiApi.generateTest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });
}
