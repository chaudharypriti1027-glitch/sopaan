import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sopaan_offline_reading_progress_v1';

export type OfflineReadingProgress = {
  bookId: string;
  lastPage: number;
  lastLine: number;
  percent: number;
  updatedAt: string;
};

async function readAll(): Promise<Record<string, OfflineReadingProgress>> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, OfflineReadingProgress>;
  } catch {
    return {};
  }
}

export async function getOfflineReadingProgress(
  bookId: string,
): Promise<OfflineReadingProgress | null> {
  const all = await readAll();
  return all[bookId] ?? null;
}

export async function saveOfflineReadingProgress(
  bookId: string,
  body: { page: number; line?: number; percent?: number },
): Promise<void> {
  const all = await readAll();
  all[bookId] = {
    bookId,
    lastPage: body.page,
    lastLine: body.line ?? 0,
    percent: body.percent ?? 0,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}
