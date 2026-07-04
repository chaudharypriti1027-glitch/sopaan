import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
} from './storage';
import type { ApiError as ApiErrorType, RefreshResponse } from './types';
import { ApiError } from './types';
import { getApiOrigin } from '../realtime/socketOrigin';

const API_BASE = getApiOrigin();

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearSession();
    return false;
  }

  const data = (await res.json()) as RefreshResponse;
  persistSession({
    accessToken: data.token ?? data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email ?? undefined,
      role: data.user.role,
    },
  });
  return true;
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  { retryOn401 = true }: { retryOn401?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && retryOn401 && getRefreshToken()) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      return apiRequest<T>(path, init, { retryOn401: false });
    }
    throw new ApiError('Session expired', 401, 'UNAUTHORIZED');
  }

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    let details: unknown;
    try {
      const body = (await res.json()) as {
        error?: { message?: string; code?: string; details?: unknown };
        message?: string;
        code?: string;
      };
      const err = body.error ?? body;
      message = err.message ?? message;
      code = err.code ?? body.code;
      details = 'details' in err ? err.details : undefined;
    } catch {
      /* empty body */
    }
    throw new ApiError(message, res.status, code, details);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export { ApiError as isApiError };
export type { ApiErrorType };
