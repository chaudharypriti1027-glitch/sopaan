import { apiRequest } from './client';
import type { PaginatedResponse } from './contentTypes';
import { normalizeDoc, normalizeList } from './normalize';

export interface AdminMentor {
  id: string;
  name: string;
  expertise: string[];
  subjects: string[];
  bio: string | null;
  rate: number | null;
  avatarUrl: string | null;
  rating: number;
  sessionsCount: number;
  isActive: boolean;
  userId: { id: string; name: string | null; email: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorListParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export type MentorInput = {
  name: string;
  subjects?: string[];
  expertise?: string[];
  bio?: string;
  rate?: number;
  avatarUrl?: string;
};

function toQuery(params: MentorListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchMentors(params: MentorListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminMentor>>(
    `/api/admin/mentors${toQuery(params)}`,
  );
  return normalizeList(data);
}

export async function fetchMentor(id: string) {
  const data = await apiRequest<AdminMentor>(`/api/admin/mentors/${id}`);
  return normalizeDoc(data);
}

export async function createMentor(body: MentorInput) {
  const data = await apiRequest<AdminMentor>('/api/admin/mentors', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function updateMentor(id: string, body: Partial<MentorInput>) {
  const data = await apiRequest<AdminMentor>(`/api/admin/mentors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return normalizeDoc(data);
}

export async function setMentorStatus(id: string, isActive: boolean) {
  const data = await apiRequest<AdminMentor>(`/api/admin/mentors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return normalizeDoc(data);
}
