import { apiRequest } from './client';
import { getAccessToken } from './storage';
import type { PaginatedResponse } from './contentTypes';
import { normalizeDoc, normalizeList } from './normalize';

export type StudentAccountStatus = 'active' | 'suspended';

export interface AdminStudent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  targetExam: string | null;
  attempts: number;
  accuracy: number | null;
  streak: number;
  tier: string;
  isPremium: boolean;
  leagueTier?: string | null;
  accountStatus: StudentAccountStatus;
  joinedAt: string;
}

export interface StudentAttempt {
  id: string;
  testTitle: string;
  subject: string | null;
  examTag: string | null;
  score: number | null;
  accuracy: number | null;
  totalTimeSec: number | null;
  createdAt: string;
}

export interface AdminStudentDetail extends AdminStudent {
  coins: number;
  level: number;
  lastAttemptAt: string | null;
  attemptHistory: StudentAttempt[];
}

export interface StudentListParams {
  q?: string;
  limit?: number;
  offset?: number;
}

function toQuery(params: StudentListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchStudents(params: StudentListParams = {}) {
  const data = await apiRequest<PaginatedResponse<AdminStudent>>(
    `/api/admin/students${toQuery(params)}`,
  );
  return normalizeList(data);
}

export async function fetchStudent(id: string) {
  const data = await apiRequest<AdminStudentDetail>(`/api/admin/students/${id}`);
  return normalizeDoc(data);
}

export async function setStudentStatus(id: string, status: StudentAccountStatus) {
  const data = await apiRequest<AdminStudent>(`/api/admin/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return normalizeDoc(data);
}

export async function downloadStudentsCsv(q?: string) {
  const API_BASE = import.meta.env.VITE_API_BASE ?? '';
  const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  const token = getAccessToken();

  const res = await fetch(`${API_BASE}/api/admin/students/export${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      /* empty */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
