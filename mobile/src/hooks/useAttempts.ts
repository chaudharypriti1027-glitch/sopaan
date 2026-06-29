import { useQuery } from '@tanstack/react-query';
import { attemptsApi, type ListAttemptsParams } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useAttempts(params?: ListAttemptsParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.attempts.list(params),
    queryFn: () => attemptsApi.listAttempts(params),
    enabled: isAuthenticated,
  });
}

export function useAttempt(id: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.attempts.detail(id ?? ''),
    queryFn: () => attemptsApi.getAttempt(id!),
    enabled: isAuthenticated && Boolean(id),
  });
}
