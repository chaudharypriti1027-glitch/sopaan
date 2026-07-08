import { apiClient } from './client';
import type { Notification, PaginatedResponse, PaginationParams } from './types';

type RawNotification = Notification & { _id?: string; data?: Record<string, unknown> | null };

function normalizeNotification(raw: RawNotification): Notification {
  return {
    id: raw.id ?? raw._id ?? '',
    type: raw.type,
    title: raw.title,
    body: raw.body,
    read: raw.read ?? false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    data: raw.data ?? null,
  };
}

export type NotificationTypePreferences = {
  rank_up: boolean;
  streak_reminder: boolean;
  new_current_affairs: boolean;
  plan_ready: boolean;
  mock_live: boolean;
  live_class_scheduled: boolean;
  progress_recap: boolean;
  badge: boolean;
  reward: boolean;
  mentor: boolean;
  premium_activated: boolean;
};

export type QuietHoursPreferences = {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
};

export type NotificationPreferences = {
  pushNotificationsEnabled: boolean;
  hasToken: boolean;
  dailyPushCap: number;
  types: NotificationTypePreferences;
  quietHours: QuietHoursPreferences;
  currentAffairsAlerts: boolean;
};

export async function listNotifications(
  params?: PaginationParams,
): Promise<PaginatedResponse<Notification>> {
  const { data } = await apiClient.get<PaginatedResponse<RawNotification>>('/notifications', {
    params,
  });
  return {
    ...data,
    items: data.items.map(normalizeNotification),
  };
}

export async function markNotificationRead(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/notifications/${id}/read`);
  return data;
}

export async function trackNotificationOpen(input: {
  notificationId?: string;
  campaignId?: string;
}): Promise<unknown> {
  const { data } = await apiClient.post('/notifications/open', input);
  return data;
}

export async function registerPushToken(input: {
  token: string;
  platform?: 'ios' | 'android' | 'web';
}): Promise<{ registered: boolean }> {
  const { data } = await apiClient.put<{ registered: boolean }>('/notifications/push-token', input);
  return data;
}

export async function updatePushSettings(enabled: boolean): Promise<{
  pushNotificationsEnabled: boolean;
  hasToken?: boolean;
  currentAffairsAlerts?: boolean;
}> {
  const { data } = await apiClient.put<{
    pushNotificationsEnabled: boolean;
    hasToken?: boolean;
    currentAffairsAlerts?: boolean;
  }>('/notifications/push-settings', { enabled });
  return data;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await apiClient.get<NotificationPreferences>('/notifications/preferences');
  return data;
}

export async function updateNotificationPreferences(
  patch: Partial<{
    types: Partial<NotificationTypePreferences>;
    quietHours: Partial<QuietHoursPreferences>;
    currentAffairsAlerts: boolean;
  }>,
): Promise<NotificationPreferences> {
  const { data } = await apiClient.put<NotificationPreferences>('/notifications/preferences', patch);
  return data;
}

/** @deprecated use getNotificationPreferences */
export type AlertPreferences = Pick<
  NotificationPreferences,
  'pushNotificationsEnabled' | 'currentAffairsAlerts' | 'hasToken'
>;

/** @deprecated use getNotificationPreferences */
export async function getAlertPreferences(): Promise<AlertPreferences> {
  const prefs = await getNotificationPreferences();
  return {
    pushNotificationsEnabled: prefs.pushNotificationsEnabled,
    currentAffairsAlerts: prefs.currentAffairsAlerts,
    hasToken: prefs.hasToken,
  };
}

/** @deprecated use updateNotificationPreferences */
export async function updateAlertPreferences(currentAffairsAlerts: boolean): Promise<AlertPreferences> {
  const prefs = await updateNotificationPreferences({
    currentAffairsAlerts,
    types: { new_current_affairs: currentAffairsAlerts },
  });
  return {
    pushNotificationsEnabled: prefs.pushNotificationsEnabled,
    currentAffairsAlerts: prefs.currentAffairsAlerts,
    hasToken: prefs.hasToken,
  };
}
