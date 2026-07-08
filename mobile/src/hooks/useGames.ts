import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeGame, type CompleteGameInput } from '../api/games';
import { useAuthStore } from '../store/auth';
import { queryKeys } from './queryKeys';

export function useCompleteGame() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((state) => state.setProfile);

  return useMutation({
    mutationFn: (input: CompleteGameInput) => completeGame(input),
    onSuccess: async (data) => {
      await setProfile(data.profile);
      queryClient.setQueryData(queryKeys.account.me(), data.profile);
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all });
    },
  });
}
