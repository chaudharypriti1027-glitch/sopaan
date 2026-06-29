import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSIST_KEY = 'sopaan_rq_cache';
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

const OFFLINE_QUERY_ROOTS = new Set(['courses', 'revision-capsules', 'notes', 'home']);

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
        staleTime: 60_000,
        gcTime: PERSIST_MAX_AGE_MS,
        retry: (failureCount, error) => {
          const offline =
            error instanceof Error &&
            (error.message.includes('Network') || error.message.includes('network'));
          if (offline) return false;
          return failureCount < 1;
        },
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
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
      const root = String(query.queryKey[0] ?? '');
      return OFFLINE_QUERY_ROOTS.has(root);
    },
  },
} as const;
