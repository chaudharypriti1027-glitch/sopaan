import { useQuery } from '@tanstack/react-query';
import { getActiveBanner } from '../api/banners';
import { queryKeys } from './queryKeys';

/** Active home promo banner — public endpoint, no auth required. */
export function useHomeBanner() {
  return useQuery({
    queryKey: queryKeys.home.banner(),
    queryFn: getActiveBanner,
    staleTime: 60_000,
    retry: false,
    select: (data) => data.banner,
  });
}
