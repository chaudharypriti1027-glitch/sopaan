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

export async function listAdminNotifications(limit = 20) {
  return apiRequest<AdminNotificationsResponse>(`/api/admin/notifications?limit=${limit}`);
}

export async function createAdminNotification(body: AdminNotificationCreateInput) {
  return apiRequest<AdminNotification>('/api/admin/notifications', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchAdminNotificationAudienceCount(
  audience: AdminNotificationAudience,
  exam?: string,
) {
  const params = new URLSearchParams({ audience });
  if (exam) {
    params.set('exam', exam);
  }
  return apiRequest<{ audience: AdminNotificationAudience; exam: string | null; count: number }>(
    `/api/admin/notifications/audience-count?${params.toString()}`,
  );
}
