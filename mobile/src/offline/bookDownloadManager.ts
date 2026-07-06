import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import type { LibraryBookDetail } from '../api/books';

const MANIFEST_KEY = 'sopaan_book_download_manifest_v1';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory ?? ''}sopaan-books/`;

export type BookBundlePage = {
  id: string;
  order: number;
  chapterId: string;
  chapterTitle: string;
  html: string;
  plainText: string;
};

export type BookBundle = {
  version: number;
  bookId: string;
  bundleVersion: string;
  signature: string;
  generatedAt: string;
  sizeBytes?: number;
  book: LibraryBookDetail['book'];
  chapters: LibraryBookDetail['chapters'];
  pages: BookBundlePage[];
};

export type BookDownloadRecord = {
  bookId: string;
  title: string;
  bundleVersion: string;
  localUri: string;
  sizeBytes: number;
  downloadedAt: string;
};

async function ensureDownloadDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

async function readManifest(): Promise<BookDownloadRecord[]> {
  const raw = await AsyncStorage.getItem(MANIFEST_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as BookDownloadRecord[];
  } catch {
    return [];
  }
}

async function writeManifest(records: BookDownloadRecord[]): Promise<void> {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(records));
}

function bundlePath(bookId: string): string {
  return `${DOWNLOAD_DIR}${bookId}.json`;
}

export async function listDownloadedBooks(): Promise<BookDownloadRecord[]> {
  return readManifest();
}

export async function isBookDownloadedLocally(bookId: string): Promise<boolean> {
  const records = await readManifest();
  return records.some((record) => record.bookId === bookId);
}

export async function getDownloadedBookBundle(bookId: string): Promise<BookBundle | null> {
  const records = await readManifest();
  const record = records.find((item) => item.bookId === bookId);
  if (!record) {
    return null;
  }

  const info = await FileSystem.getInfoAsync(record.localUri);
  if (!info.exists) {
    return null;
  }

  try {
    const raw = await FileSystem.readAsStringAsync(record.localUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(raw) as BookBundle;
  } catch {
    return null;
  }
}

export async function saveBookBundle(bundle: BookBundle): Promise<BookDownloadRecord> {
  await ensureDownloadDir();
  const localUri = bundlePath(bundle.bookId);
  const serialized = JSON.stringify(bundle);

  await FileSystem.writeAsStringAsync(localUri, serialized, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const record: BookDownloadRecord = {
    bookId: bundle.bookId,
    title: bundle.book.title,
    bundleVersion: bundle.bundleVersion,
    localUri,
    sizeBytes: bundle.sizeBytes ?? new TextEncoder().encode(serialized).length,
    downloadedAt: new Date().toISOString(),
  };

  const records = await readManifest();
  const next = records.filter((item) => item.bookId !== bundle.bookId);
  next.unshift(record);
  await writeManifest(next);

  return record;
}

export async function removeBookBundle(bookId: string): Promise<void> {
  const records = await readManifest();
  const existing = records.find((record) => record.bookId === bookId);

  if (existing?.localUri) {
    const info = await FileSystem.getInfoAsync(existing.localUri);
    if (info.exists) {
      await FileSystem.deleteAsync(existing.localUri, { idempotent: true });
    }
  }

  await writeManifest(records.filter((record) => record.bookId !== bookId));
}
