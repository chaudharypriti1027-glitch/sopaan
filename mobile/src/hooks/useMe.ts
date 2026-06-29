import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe, type UpdateMeInput } from '../api/me';
import { useAuthStore } from '../store/auth';
import { queryKeys } from './queryKeys';

/** Cached auth profile instantly, then sync GET /api/me on every visit. */
export function useMe() {
  const cachedProfile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const isAuthenticated = useAuthStore((state) => state.status === 'authed');

  return useQuery({
    queryKey: queryKeys.account.me(),
    queryFn: async () => {
      const profile = await getMe();
      await setProfile(profile);
      return profile;
    },
    enabled: isAuthenticated,
    initialData: cachedProfile ?? undefined,
    initialDataUpdatedAt: cachedProfile ? Date.now() : undefined,
    refetchOnMount: 'always',
    staleTime: 30_000,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((state) => state.setProfile);

  return useMutation({
    mutationFn: (input: UpdateMeInput) => updateMe(input),
    onSuccess: async (profile) => {
      await setProfile(profile);
      queryClient.setQueryData(queryKeys.account.me(), profile);
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}
