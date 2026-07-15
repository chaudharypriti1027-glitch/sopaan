import { apiRequest } from './client';

export type LiveClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export type AdminLiveClass = {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  educatorId?: string | null;
  exam: string;
  examTag: string;
  topic?: string | null;
  startsAt: string;
  scheduledAt: string;
  durationMin: number;
  status: LiveClassStatus;
  roomName: string;
  coverUrl?: string | null;
  autoRecord: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  viewersPeak?: number;
  viewers?: number;
  attendeeCount?: number;
  recordingUrl?: string | null;
  recordingStatus?: 'pending' | 'ready' | 'failed' | null;
  recordingPublished?: boolean;
  recordingDurationSec?: number | null;
  egressId?: string | null;
};

export type AdminLiveClassesResponse = {
  items: AdminLiveClass[];
  summary: {
    liveCount: number;
    scheduledCount: number;
    recordingCount: number;
    watchingNow: number;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type LiveTokenResponse = {
  status: 'live' | 'scheduled' | 'ended' | 'cancelled';
  liveClassId: string;
  roomName: string;
  url?: string;
  token: string | null;
  role?: 'host' | 'student';
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
  message?: string;
  startsAt?: string;
  recordingUrl?: string | null;
};

export type LiveClassCreateInput = {
  title: string;
  description?: string;
  instructor?: string;
  educatorId?: string;
  exam: string;
  topic?: string;
  startsAt: string;
  durationMin: number;
  coverUrl?: string;
  autoRecord?: boolean;
  notify?: boolean;
};

function normalizeLiveClass(row: Partial<AdminLiveClass> | null | undefined): AdminLiveClass {
  return {
    id: row?.id ?? '',
    title: row?.title ?? 'Untitled class',
    description: row?.description ?? '',
    instructor: row?.instructor ?? '—',
    educatorId: row?.educatorId ?? null,
    exam: row?.exam ?? '',
    examTag: row?.examTag ?? row?.exam ?? '',
    topic: row?.topic ?? null,
    startsAt: row?.startsAt ?? row?.scheduledAt ?? '',
    scheduledAt: row?.scheduledAt ?? row?.startsAt ?? '',
    durationMin: row?.durationMin ?? 0,
    status: row?.status ?? 'scheduled',
    roomName: row?.roomName ?? '',
    coverUrl: row?.coverUrl ?? null,
    autoRecord: Boolean(row?.autoRecord),
    startedAt: row?.startedAt ?? null,
    endedAt: row?.endedAt ?? null,
    viewersPeak: row?.viewersPeak ?? 0,
    viewers: row?.viewers ?? 0,
    attendeeCount: row?.attendeeCount ?? 0,
    recordingUrl: row?.recordingUrl ?? null,
    recordingStatus: row?.recordingStatus ?? null,
    recordingPublished: Boolean(row?.recordingPublished),
    recordingDurationSec: row?.recordingDurationSec ?? null,
    egressId: row?.egressId ?? null,
  };
}

export async function listAdminLiveClasses(status?: LiveClassStatus) {
  const query = status ? `?status=${status}&limit=100` : '?limit=100';
  const data = await apiRequest<AdminLiveClassesResponse | null>(`/api/admin/live-classes${query}`);
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items.map(normalizeLiveClass),
    summary: {
      liveCount: data?.summary?.liveCount ?? 0,
      scheduledCount: data?.summary?.scheduledCount ?? 0,
      recordingCount: data?.summary?.recordingCount ?? 0,
      watchingNow: data?.summary?.watchingNow ?? 0,
    },
    pagination: {
      total: data?.pagination?.total ?? items.length,
      limit: data?.pagination?.limit ?? 100,
      offset: data?.pagination?.offset ?? 0,
      hasMore: Boolean(data?.pagination?.hasMore),
    },
  };
}

export async function createAdminLiveClass(body: LiveClassCreateInput) {
  return apiRequest<AdminLiveClass>('/api/admin/live-classes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function startAdminLiveClass(id: string) {
  return apiRequest<AdminLiveClass>(`/api/admin/live-classes/${id}/start`, {
    method: 'POST',
  });
}

export async function endAdminLiveClass(id: string) {
  return apiRequest<AdminLiveClass>(`/api/admin/live-classes/${id}/end`, {
    method: 'POST',
  });
}

export async function cancelAdminLiveClass(id: string) {
  return apiRequest<AdminLiveClass>(`/api/admin/live-classes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

export async function fetchLiveHostToken(classId: string) {
  return apiRequest<LiveTokenResponse>(`/api/live/${classId}/token`);
}

export async function setAdminLiveClassRecordingPublished(id: string, published: boolean) {
  return apiRequest<AdminLiveClass>(`/api/admin/live-classes/${id}/recording`, {
    method: 'PATCH',
    body: JSON.stringify({ published }),
  });
}
