import { useQuery } from '@tanstack/react-query';
import { currentAffairsApi, type ListCurrentAffairsParams } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useCurrentAffairs(params?: ListCurrentAffairsParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.currentAffairs.list(params),
    queryFn: () => currentAffairsApi.listCurrentAffairs(params),
    enabled: isAuthenticated,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useCurrentAffair(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.currentAffairs.detail(id ?? ''),
    queryFn: () => currentAffairsApi.getCurrentAffair(id!),
    enabled: Boolean(id),
  });
}
