import { getSecureItem, setSecureItem } from '../lib/secureStorage';

const SAVED_AFFAIRS_KEY = 'sopaan_saved_affairs';

export async function listSavedAffairIds(): Promise<string[]> {
  const raw = await getSecureItem(SAVED_AFFAIRS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function isAffairSaved(id: string): Promise<boolean> {
  const ids = await listSavedAffairIds();
  return ids.includes(id);
}

export async function toggleSavedAffair(id: string): Promise<boolean> {
  const ids = await listSavedAffairIds();
  const exists = ids.includes(id);
  const next = exists ? ids.filter((item) => item !== id) : [id, ...ids].slice(0, 100);
  await setSecureItem(SAVED_AFFAIRS_KEY, JSON.stringify(next));
  return !exists;
}
