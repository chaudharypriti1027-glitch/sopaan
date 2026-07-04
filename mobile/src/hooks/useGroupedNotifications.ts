import { useMemo } from 'react';
import { useNotifications } from './useNotifications';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function useGroupedNotifications() {
  const query = useNotifications({ limit: 50 });

  const grouped = useMemo(() => {
    const todayStart = startOfToday().getTime();
    const today: NonNullable<typeof query.data>['items'] = [];
    const earlier: NonNullable<typeof query.data>['items'] = [];

    for (const item of query.data?.items ?? []) {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      if (created >= todayStart) {
        today.push(item);
      } else {
        earlier.push(item);
      }
    }

    return { today, earlier };
    // Depend on `query.data` only — `query` itself is a new object on every
    // react-query render, so including it would defeat this memoization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const unreadCount = useMemo(
    () => (query.data?.items ?? []).filter((item) => !item.read).length,
    [query.data],
  );

  return {
    ...query,
    grouped,
    unreadCount,
  };
}
