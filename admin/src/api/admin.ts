import { apiRequest } from './client';
import type { AdminStats, AttemptsSeriesResponse, AuditLogResponse, LoginResponse } from './types';
import { persistSession } from './storage';
import { isStaffRole } from '../auth/roles';

export async function loginAdmin(email: string, password: string) {
  const data = await apiRequest<LoginResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    { retryOn401: false },
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

export function fetchAdminStats() {
  return apiRequest<AdminStats>('/api/admin/stats');
}

export function fetchAttemptsSeries(days = 14) {
  return apiRequest<AttemptsSeriesResponse>(`/api/admin/stats/attempts?days=${days}`);
}

export function fetchAuditLogs(limit = 20) {
  return apiRequest<AuditLogResponse>(`/api/admin/audit-logs?limit=${limit}`);
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
