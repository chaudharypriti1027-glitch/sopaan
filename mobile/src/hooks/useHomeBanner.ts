import { useQuery } from '@tanstack/react-query';
import { getActiveBanner } from '../api/banners';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useHomeBanner() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.home.banner(),
    queryFn: getActiveBanner,
    enabled: isAuthenticated,
    staleTime: 60_000,
    select: (data) => data.banner,
  });
}
