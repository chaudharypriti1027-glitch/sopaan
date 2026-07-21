import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../api/errors';

const PERSIST_KEY = 'sopaan_rq_cache_v3';
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

const OFFLINE_QUERY_ROOTS = new Set([
  'books',
  'courses',
  'revision-capsules',
  'notes',
  'home',
]);

function isRetryableQueryError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Hard network failures (ATS / offline / wrong host) should not burn
    // 3 × 60s timeouts — one retry is enough to recover from blips.
    if (error.status === 0) {
      return error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    }
    return error.status === 429 || error.status >= 502;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  if (message.includes('timeout')) {
    return true;
  }

  if ('status' in error && typeof error.status === 'number') {
    const status = error.status;
    return status === 429 || status >= 502;
  }

  return false;
}

const memoryFallback = new Map<string, string>();

/** Avoid hard failures when the native AsyncStorage module is unavailable (e.g. dev reload). */
const resilientStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryFallback.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryFallback.set(key, value);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryFallback.delete(key);
    }
  },
};

export function createPersistedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: PERSIST_MAX_AGE_MS,
        retry: (failureCount, error) => {
          if (!isRetryableQueryError(error)) {
            return false;
          }
          // Network/timeout: 1 retry. Transient 429/5xx: up to 2 retries.
          const max =
            error instanceof ApiError && error.status === 0 ? 1 : 2;
          return failureCount < max;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        networkMode: 'offlineFirst',
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  });
}

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: resilientStorage,
  key: PERSIST_KEY,
  throttleTime: 2000,
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: PERSIST_MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: {
      queryKey: readonly unknown[];
      state: { status: string };
    }) => {
      const root = String(query.queryKey[0] ?? '');
      if (!OFFLINE_QUERY_ROOTS.has(root)) {
        return false;
      }
      return query.state.status === 'success';
    },
  },
} as const;
