import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const MANIFEST_KEY = 'sopaan_download_manifest_v1';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory ?? ''}sopaan-lessons/`;

export type DownloadKind = 'video' | 'notes';
export type DownloadStatus = 'downloading' | 'completed' | 'failed';

export type DownloadRecord = {
  key: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  kind: DownloadKind;
  localUri: string;
  status: DownloadStatus;
  updatedAt: string;
  errorMessage?: string;
};

function downloadKey(courseId: string, lessonId: string, kind: DownloadKind): string {
  return `${courseId}:${lessonId}:${kind}`;
}

async function ensureDownloadDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

async function readManifest(): Promise<DownloadRecord[]> {
  const raw = await AsyncStorage.getItem(MANIFEST_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as DownloadRecord[];
  } catch {
    return [];
  }
}

async function writeManifest(records: DownloadRecord[]): Promise<void> {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(records));
}

async function upsertRecord(record: DownloadRecord): Promise<void> {
  const records = await readManifest();
  const next = records.filter((item) => item.key !== record.key);
  next.unshift(record);
  await writeManifest(next);
}

export async function listDownloads(courseId?: string): Promise<DownloadRecord[]> {
  const records = await readManifest();
  if (!courseId) {
    return records;
  }
  return records.filter((record) => record.courseId === courseId);
}

export async function getDownload(
  courseId: string,
  lessonId: string,
  kind: DownloadKind,
): Promise<DownloadRecord | null> {
  const key = downloadKey(courseId, lessonId, kind);
  const records = await readManifest();
  return records.find((record) => record.key === key && record.status === 'completed') ?? null;
}

export async function removeDownload(
  courseId: string,
  lessonId: string,
  kind: DownloadKind,
): Promise<void> {
  const key = downloadKey(courseId, lessonId, kind);
  const records = await readManifest();
  const existing = records.find((record) => record.key === key);

  if (existing?.localUri) {
    const info = await FileSystem.getInfoAsync(existing.localUri);
    if (info.exists) {
      await FileSystem.deleteAsync(existing.localUri, { idempotent: true });
    }
  }

  await writeManifest(records.filter((record) => record.key !== key));
}

export async function downloadLessonVideo(input: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  videoUrl: string;
}): Promise<DownloadRecord> {
  const key = downloadKey(input.courseId, input.lessonId, 'video');
  await ensureDownloadDir();

  const extension = input.videoUrl.split('?')[0]?.split('.').pop() ?? 'mp4';
  const localUri = `${DOWNLOAD_DIR}${key.replace(/:/g, '_')}.${extension}`;

  const pending: DownloadRecord = {
    key,
    courseId: input.courseId,
    lessonId: input.lessonId,
    lessonTitle: input.lessonTitle,
    kind: 'video',
    localUri,
    status: 'downloading',
    updatedAt: new Date().toISOString(),
  };
  await upsertRecord(pending);

  try {
    const result = await FileSystem.downloadAsync(input.videoUrl, localUri);
    const completed: DownloadRecord = {
      ...pending,
      localUri: result.uri,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
    await upsertRecord(completed);
    return completed;
  } catch (error) {
    const failed: DownloadRecord = {
      ...pending,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Download failed',
      updatedAt: new Date().toISOString(),
    };
    await upsertRecord(failed);
    throw error;
  }
}

export async function downloadLessonNotes(input: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  notes: string;
}): Promise<DownloadRecord> {
  const key = downloadKey(input.courseId, input.lessonId, 'notes');
  await ensureDownloadDir();

  const localUri = `${DOWNLOAD_DIR}${key.replace(/:/g, '_')}.txt`;

  const pending: DownloadRecord = {
    key,
    courseId: input.courseId,
    lessonId: input.lessonId,
    lessonTitle: input.lessonTitle,
    kind: 'notes',
    localUri,
    status: 'downloading',
    updatedAt: new Date().toISOString(),
  };
  await upsertRecord(pending);

  try {
    await FileSystem.writeAsStringAsync(localUri, input.notes, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const completed: DownloadRecord = {
      ...pending,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
    await upsertRecord(completed);
    return completed;
  } catch (error) {
    const failed: DownloadRecord = {
      ...pending,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Save failed',
      updatedAt: new Date().toISOString(),
    };
    await upsertRecord(failed);
    throw error;
  }
}
