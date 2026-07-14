import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminLiveClassesResponse } from '../api/liveClasses';
import { connectAdminSocket, onAdminLivePresence } from '../realtime/adminSocket';

function patchLivePresence(
  current: AdminLiveClassesResponse | undefined,
  classId: string,
  count: number,
): AdminLiveClassesResponse | undefined {
  if (!current) {
    return current;
  }

  const items = current.items.map((item) =>
    item.id === classId
      ? {
          ...item,
          viewers: count,
          attendeeCount: count,
          viewersPeak: Math.max(item.viewersPeak ?? 0, count),
        }
      : item,
  );

  const watchingNow = items
    .filter((item) => item.status === 'live')
    .reduce((sum, item) => sum + (item.viewers ?? item.attendeeCount ?? 0), 0);

  return {
    ...current,
    items,
    summary: {
      ...current.summary,
      watchingNow,
    },
  };
}

/** Push live viewer counts into the admin live-classes query cache. */
export function useAdminLiveClassesRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    connectAdminSocket();

    return onAdminLivePresence((payload) => {
      queryClient.setQueryData<AdminLiveClassesResponse>(['admin', 'live-classes'], (current) =>
        patchLivePresence(current, payload.classId, payload.count),
      );
    });
  }, [enabled, queryClient]);
}
