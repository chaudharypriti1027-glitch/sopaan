import { apiRequest } from './client';
import type {
  AdminCurrentAffair,
  ContentListParams,
  PaginatedResponse,
  PublishStatus,
} from './contentTypes';
import { normalizeDoc, normalizeList } from './normalize';

function toQuery(params: ContentListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export type CurrentAffairInput = {
  title: string;
  summary?: string;
  category?: string;
  source?: string;
  publishedAt: string;
  imageColor?: string;
  status?: PublishStatus;
};

export async function fetchCurrentAffairs(params: ContentListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminCurrentAffair>>(
    `/api/admin/current-affairs${toQuery(params)}`,
  );
  return normalizeList(data);
}

export async function fetchCurrentAffair(id: string) {
  const data = await apiRequest<AdminCurrentAffair>(`/api/admin/current-affairs/${id}`);
  return normalizeDoc(data);
}

export async function createCurrentAffair(body: CurrentAffairInput) {
  const data = await apiRequest<AdminCurrentAffair>('/api/admin/current-affairs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function updateCurrentAffair(id: string, body: Partial<CurrentAffairInput>) {
  const data = await apiRequest<AdminCurrentAffair>(`/api/admin/current-affairs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function setCurrentAffairStatus(id: string, status: PublishStatus) {
  const data = await apiRequest<AdminCurrentAffair>(`/api/admin/current-affairs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return normalizeDoc(data);
}

export async function deleteCurrentAffair(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/admin/current-affairs/${id}`, {
    method: 'DELETE',
  });
}

export async function generateCurrentAffairAi(id: string) {
  const data = await apiRequest<AdminCurrentAffair>(`/api/admin/current-affairs/${id}/ai`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return normalizeDoc(data);
}
