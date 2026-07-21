import { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
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
  _rateRetry?: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export const apiClient = create({
  baseURL: config.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  // Fail faster on unreachable hosts (was 60s × retries → multi-minute hangs).
  timeout: 20_000,
});

/**
 * TEMPORARY API debug logging (visible via `adb logcat` in release builds).
 * Enabled in dev always; in production only when EXPO_PUBLIC_DEBUG_API=true.
 * Remove the eas.json flag once the physical-device issue is confirmed fixed.
 */
const DEBUG_API = __DEV__ || process.env.EXPO_PUBLIC_DEBUG_API === 'true';

function debugHeaders(headers: unknown): Record<string, unknown> {
  const plain = { ...(headers as Record<string, unknown>) };
  if (typeof plain.Authorization === 'string') {
    plain.Authorization = `Bearer …${plain.Authorization.slice(-6)}`;
  }
  return plain;
}

function logApiRequest(requestConfig: InternalAxiosRequestConfig) {
  if (!DEBUG_API) return;
  // eslint-disable-next-line no-console
  console.log(
    '[api →]',
    requestConfig.method?.toUpperCase(),
    `${requestConfig.baseURL ?? ''}${requestConfig.url ?? ''}`,
    JSON.stringify({
      baseURL: requestConfig.baseURL,
      headers: debugHeaders(requestConfig.headers),
      body: requestConfig.data,
      params: requestConfig.params,
    }),
  );
}

function logApiError(error: AxiosError) {
  if (!DEBUG_API) return;
  // eslint-disable-next-line no-console
  console.log(
    '[api ✗]',
    error.config?.method?.toUpperCase(),
    `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
    JSON.stringify({
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    }),
    error.stack,
  );
}

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

  logApiRequest(requestConfig);
  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    logApiError(error);
    const original = error.config as RetryConfig | undefined;

    if (
      original &&
      !original._rateRetry &&
      error.response?.status === 429
    ) {
      original._rateRetry = true;
      await sleep(1200);
      return apiClient(original);
    }

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
