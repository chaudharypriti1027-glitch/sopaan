import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExperimentsResponse } from '../api/experiments';
import {
  DEFAULT_EXPERIMENT_ASSIGNMENTS,
  DEFAULT_EXPERIMENT_PAYLOADS,
} from './defaults';

const CACHE_KEY = 'sopaan_experiments_cache_v1';

export type CachedExperiments = ExperimentsResponse & {
  cachedAt: number;
};

export function buildDefaultExperiments(installId: string): CachedExperiments {
  return {
    installId,
    assignments: DEFAULT_EXPERIMENT_ASSIGNMENTS,
    payloads: DEFAULT_EXPERIMENT_PAYLOADS,
    isDefault: true,
    cachedAt: Date.now(),
  };
}

export async function loadCachedExperiments(): Promise<CachedExperiments | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CachedExperiments;
  } catch {
    return null;
  }
}

export async function saveCachedExperiments(data: ExperimentsResponse): Promise<CachedExperiments> {
  const cached: CachedExperiments = {
    ...data,
    cachedAt: Date.now(),
  };

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  return cached;
}

export async function clearCachedExperiments(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
