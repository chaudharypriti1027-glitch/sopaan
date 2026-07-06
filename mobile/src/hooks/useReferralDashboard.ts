import { useQuery } from '@tanstack/react-query';
import { getMyReferrals } from '../api/referrals';
import { useAuthStore } from '../store/auth';
import { queryKeys } from './queryKeys';

/** Referral dashboard — only when session is active; no retry on auth errors. */
export function useReferralDashboard() {
  const status = useAuthStore((state) => state.status);
  const profileId = useAuthStore((state) => state.profile?.id);
  const isAuthenticated = status === 'authed' && Boolean(profileId);

  return useQuery({
    queryKey: queryKeys.referrals.me(),
    queryFn: getMyReferrals,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
