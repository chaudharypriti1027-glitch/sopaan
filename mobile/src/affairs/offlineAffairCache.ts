import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrentAffair } from '../api/types';

const CACHE_KEY = 'sopaan_ca_offline_v1';

type OfflineAffairCache = Record<string, CurrentAffair>;

async function readCache(): Promise<OfflineAffairCache> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as OfflineAffairCache;
  } catch {
    return {};
  }
}

async function writeCache(cache: OfflineAffairCache): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function cacheAffair(affair: CurrentAffair): Promise<void> {
  if (!affair.id) {
    return;
  }

  const cache = await readCache();
  cache[affair.id] = {
    ...affair,
    cachedAt: new Date().toISOString(),
  };
  await writeCache(cache);
}

export async function getCachedAffair(id: string): Promise<CurrentAffair | null> {
  const cache = await readCache();
  return cache[id] ?? null;
}

export async function listCachedAffairs(): Promise<CurrentAffair[]> {
  const cache = await readCache();
  return Object.values(cache).sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
  );
}

export async function removeCachedAffair(id: string): Promise<void> {
  const cache = await readCache();
  if (!cache[id]) {
    return;
  }

  delete cache[id];
  await writeCache(cache);
}

export async function isAffairCached(id: string): Promise<boolean> {
  const cache = await readCache();
  return Boolean(cache[id]);
}
