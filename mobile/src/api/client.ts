import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import { getAppLanguage } from './language';
import { getAccessToken, getTokens, saveTokens, clearTokens } from '../lib/secure';
import { runSignOutHandler } from '../store/sessionActions';
import { parseApiError, rawPost } from './errors';
import type { RefreshResponse } from './types';
import { createRequestId } from '../observability/requestId';
import { captureMobileException } from '../observability/sentry';
import { refreshSocketAuth } from '../realtime/socketManager';

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueEntry[] = [];
let onSessionExpired: (() => void) | null = null;

function flushQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((entry) => {
    if (error || !token) {
      entry.reject(error);
      return;
    }
    entry.resolve(token);
  });
  refreshQueue = [];
}

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string> {
  const tokens = await getTokens();

  if (!tokens?.refreshToken) {
    throw new Error('No refresh token');
  }

  const data = await rawPost<RefreshResponse>(`${config.apiBaseUrl}/auth/refresh`, {
    refreshToken: tokens.refreshToken,
  });

  const token = data.token ?? data.accessToken;
  const refreshToken = data.refreshToken ?? tokens.refreshToken;

  await saveTokens({ token, refreshToken });
  await refreshSocketAuth(getAccessToken);
  return token;
}

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

const CONTENT_GET_PREFIXES = ['/courses', '/revision-capsules'];

apiClient.interceptors.request.use(async (requestConfig) => {
  requestConfig.headers['x-request-id'] = createRequestId();
  requestConfig.headers['x-app-platform'] = config.platform;
  requestConfig.headers['x-app-native-version'] = config.nativeVersion;
  requestConfig.headers['x-app-runtime-version'] = config.runtimeVersion;
  requestConfig.headers['x-app-language'] = getAppLanguage();

  const token = await getAccessToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }

  const method = requestConfig.method?.toLowerCase();
  const path = requestConfig.url ?? '';
  const isContentGet =
    method === 'get' && CONTENT_GET_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isContentGet) {
    requestConfig.params = {
      ...requestConfig.params,
      language: getAppLanguage(),
    };
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (!original || original._retry || error.response?.status !== 401) {
      const parsed = parseApiError(error);

      if (!error.response || error.response.status >= 500) {
        captureMobileException(error, {
          tags: {
            requestId: String(original?.headers?.['x-request-id'] ?? 'unknown'),
          },
          extra: {
            url: original?.url,
            method: original?.method,
            status: error.response?.status,
            code: parsed.code,
          },
        });
      }

      return Promise.reject(parsed);
    }

    const isRefreshRequest = original.url?.includes('/auth/refresh');
    if (isRefreshRequest) {
      await clearTokens();
      await runSignOutHandler();
      onSessionExpired?.();
      return Promise.reject(parseApiError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      flushQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      await clearTokens();
      await runSignOutHandler();
      onSessionExpired?.();
      return Promise.reject(parseApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);
