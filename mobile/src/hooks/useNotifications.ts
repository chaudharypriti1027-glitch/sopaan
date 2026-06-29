import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type PaginationParams } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useNotifications(params?: PaginationParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsApi.listNotifications(params),
    enabled: isAuthenticated,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
