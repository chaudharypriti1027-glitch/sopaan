import { apiRequest } from './client';

export type AdminNotificationAudience = 'all' | 'active30d' | 'pro' | 'free' | 'byExam';

export type AdminNotificationStatus = 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  audience: AdminNotificationAudience;
  exam?: string | null;
  sendAt: string;
  status: AdminNotificationStatus;
  stats: {
    targeted: number;
    inApp: number;
    delivered: number;
    opened: number;
    skipped: number;
    openRate: number;
  };
  sentAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  errorMessage?: string | null;
};

export type AdminNotificationsResponse = {
  items: AdminNotification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type AdminNotificationCreateInput = {
  title: string;
  body: string;
  audience: AdminNotificationAudience;
  exam?: string;
  sendAt?: string;
};

const EMPTY_STATS: AdminNotification['stats'] = {
  targeted: 0,
  inApp: 0,
  delivered: 0,
  opened: 0,
  skipped: 0,
  openRate: 0,
};

function normalizeNotification(
  row: Partial<AdminNotification> | null | undefined
): AdminNotification {
  return {
    id: row?.id ?? '',
    title: row?.title ?? 'Untitled notification',
    body: row?.body ?? '',
    audience: row?.audience ?? 'all',
    exam: row?.exam ?? null,
    sendAt: row?.sendAt ?? '',
    status: row?.status ?? 'scheduled',
    stats: { ...EMPTY_STATS, ...(row?.stats ?? {}) },
    sentAt: row?.sentAt ?? null,
    completedAt: row?.completedAt ?? null,
    createdAt: row?.createdAt ?? '',
    errorMessage: row?.errorMessage ?? null,
  };
}

export async function listAdminNotifications(limit = 20) {
  const data = await apiRequest<AdminNotificationsResponse | null>(
    `/api/admin/notifications?limit=${limit}`
  );
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items.map(normalizeNotification),
    pagination: {
      total: data?.pagination?.total ?? items.length,
      limit: data?.pagination?.limit ?? limit,
      offset: data?.pagination?.offset ?? 0,
      hasMore: Boolean(data?.pagination?.hasMore),
    },
  };
}

export async function createAdminNotification(body: AdminNotificationCreateInput) {
  const data = await apiRequest<AdminNotification | null>('/api/admin/notifications', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeNotification(data);
}

export async function fetchAdminNotificationAudienceCount(
  audience: AdminNotificationAudience,
  exam?: string
) {
  const params = new URLSearchParams({ audience });
  if (exam) {
    params.set('exam', exam);
  }
  const data = await apiRequest<{
    audience?: AdminNotificationAudience;
    exam?: string | null;
    count?: number;
  } | null>(`/api/admin/notifications/audience-count?${params.toString()}`);
  return {
    audience: data?.audience ?? audience,
    exam: data?.exam ?? exam ?? null,
    count: data?.count ?? 0,
  };
}
