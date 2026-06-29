import { apiClient } from './client';

export type LiveClassStatus = 'scheduled' | 'live' | 'ended';

export type LiveClass = {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  examTag: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationMin: number;
  thumbnailColor?: string;
  status: LiveClassStatus;
  viewers?: number;
  attendeeCount?: number;
  reminderSet?: boolean;
  streamingConfigured?: boolean;
  recordingUrl?: string | null;
  recordingStatus?: 'pending' | 'ready' | 'failed' | null;
};

export type LiveClassesResponse = {
  streamingConfigured: boolean;
  comingSoon: boolean;
  message?: string | null;
  liveNow: LiveClass | null;
  scheduled: LiveClass[];
  recorded?: LiveClass[];
};

export type LiveTokenResponse = {
  liveClassId: string;
  roomName: string;
  provider: string;
  url: string;
  token: string;
  role: 'host' | 'viewer';
  attendeeCount: number;
};

/** @deprecated use LiveTokenResponse */
export type ViewerTokenResponse = LiveTokenResponse;

export type LiveClassReminderResponse = {
  liveClassId: string;
  remindAt: string;
  reminderSet: boolean;
};

export async function getLiveClasses(): Promise<LiveClassesResponse> {
  const { data } = await apiClient.get<LiveClassesResponse>('/live-classes');
  return data;
}

export async function getLiveClass(id: string): Promise<LiveClass> {
  const { data } = await apiClient.get<LiveClass>(`/live-classes/${id}`);
  return data;
}

export async function getLiveToken(classId: string): Promise<LiveTokenResponse> {
  const { data } = await apiClient.get<LiveTokenResponse>(`/live/${classId}/token`);
  return data;
}

/** @deprecated use getLiveToken */
export async function getViewerToken(id: string): Promise<LiveTokenResponse> {
  return getLiveToken(id);
}

export async function setLiveClassReminder(id: string): Promise<LiveClassReminderResponse> {
  const { data } = await apiClient.post<LiveClassReminderResponse>(`/live-classes/${id}/reminders`);
  return data;
}

export async function removeLiveClassReminder(id: string): Promise<LiveClassReminderResponse> {
  const { data } = await apiClient.delete<LiveClassReminderResponse>(`/live-classes/${id}/reminders`);
  return data;
}
