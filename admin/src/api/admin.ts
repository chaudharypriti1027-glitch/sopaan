import { apiRequest } from './client';
import type { AdminStats, AttemptsSeriesResponse, AuditLogResponse, LoginResponse } from './types';
import { persistSession } from './storage';
import { isStaffRole } from '../auth/roles';

const EMPTY_STATS: AdminStats = {
  activeStudents: 0,
  totalStudents: 0,
  attemptsLast30Days: 0,
  testsPublished: 0,
  pendingReviews: 0,
  pendingQuestionReviews: 0,
  questionsTotal: 0,
  questionsPublished: 0,
  coursesPublished: 0,
  currentAffairsPublished: 0,
  liveClasses: 0,
  examsTotal: 0,
  mentorsTotal: 0,
  aiFeedbackPending: 0,
};

export async function loginAdmin(email: string, password: string) {
  const data = await apiRequest<LoginResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    { retryOn401: false }
  );

  const role = data.profile.role ?? 'student';
  if (!isStaffRole(role)) {
    throw new Error('Only team accounts (admin, creator, moderator) can access this console');
  }

  persistSession({
    accessToken: data.token,
    refreshToken: data.refreshToken,
    user: {
      id: data.profile.id,
      name: data.profile.name,
      email: data.profile.email,
      role,
    },
  });

  return data;
}

export async function fetchAdminStats() {
  const data = await apiRequest<Partial<AdminStats> | null>('/api/admin/stats');
  return { ...EMPTY_STATS, ...(data ?? {}) };
}

export async function fetchAttemptsSeries(days = 14) {
  const data = await apiRequest<AttemptsSeriesResponse | null>(
    `/api/admin/stats/attempts?days=${days}`
  );
  const series = Array.isArray(data?.series) ? data.series : [];
  return {
    days: data?.days ?? days,
    series: series.map((point) => ({
      date: point?.date ?? '',
      label: point?.label ?? '',
      value: Number.isFinite(point?.value) ? point.value : 0,
    })),
  };
}

export async function fetchAuditLogs(limit = 20) {
  const data = await apiRequest<AuditLogResponse | null>(`/api/admin/audit-logs?limit=${limit}`);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
  };
}

export function recordAuditTest() {
  return apiRequest<{ ok: boolean; message: string }>('/api/admin/audit/test', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchLoginHint() {
  try {
    const res = await fetch('/admin/login-hint.json');
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string | null };
    return data.email ?? null;
  } catch {
    return null;
  }
}
