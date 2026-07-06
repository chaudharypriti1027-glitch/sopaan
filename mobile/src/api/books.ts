import { apiClient } from './client';

export type LibraryCoverTheme = 'navy' | 'gold' | 'sage' | 'deep' | 'rust';

export type LibraryBook = {
  id: string;
  title: string;
  author?: string;
  subject: string;
  coverTheme: LibraryCoverTheme;
  rating?: number;
  pages?: number;
  isPro: boolean;
  isDownloaded: boolean;
  inProgress: boolean;
  progressPercent?: number;
};

export type LibraryListParams = {
  subject?: string;
  type?: 'books' | 'notes';
  q?: string;
  pro?: boolean;
  sort?: 'popular' | 'new' | 'rating';
  page?: number;
  limit?: number;
};

export type LibraryListResponse = {
  items: LibraryBook[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type LibrarySubjectCount = {
  subject: string;
  count: number;
};

export type LibrarySubjectsResponse = {
  subjects: LibrarySubjectCount[];
};

export type LibraryChapterPreview = {
  id: string;
  order: number;
  title: string;
};

export type LibraryReadingProgress = {
  lastPage: number;
  lastLine: number;
  percent: number;
  updatedAt?: string;
};

export type LibraryBookDetail = {
  book: LibraryBook & {
    slug: string;
    description?: string;
    language: string;
    ratingsCount?: number;
    status: string;
    tags: string[];
    createdAt?: string;
  };
  chapters: LibraryChapterPreview[];
  progress: LibraryReadingProgress | null;
};

/** @deprecated Use LibraryBook */
export type Book = LibraryBook;

export async function listBooks(params?: LibraryListParams): Promise<LibraryListResponse> {
  const { data } = await apiClient.get<LibraryListResponse>('/books', { params });
  return data;
}

export async function listSubjects(): Promise<LibrarySubjectsResponse> {
  const { data } = await apiClient.get<LibrarySubjectsResponse>('/books/subjects');
  return data;
}

export type LibraryPage = {
  id: string;
  order: number;
  html: string;
};

export type LibraryChapterPagesResponse = {
  pages: LibraryPage[];
  locked: boolean;
  totalPages: number;
};

export type LibraryReaderPage = LibraryPage & {
  chapterId: string;
  chapterTitle: string;
};

export type LibraryReaderContent = {
  book: LibraryBookDetail['book'];
  chapters: LibraryChapterPreview[];
  progress: LibraryReadingProgress | null;
  pages: LibraryReaderPage[];
  locked: boolean;
  totalPages: number;
};

export type LibraryBookmark = {
  id: string;
  bookId: string;
  page: number;
  line: number;
  note: string;
  createdAt?: string;
};

export type LibraryProgressInput = {
  page: number;
  line?: number;
  percent?: number;
};

export async function getBook(id: string): Promise<LibraryBookDetail> {
  const { data } = await apiClient.get<LibraryBookDetail>(`/books/${id}`);
  return data;
}

export async function getBookReader(id: string): Promise<LibraryReaderContent> {
  const { data } = await apiClient.get<LibraryReaderContent>(`/books/${id}/reader`);
  return data;
}

export async function getChapterPages(
  bookId: string,
  chapterId: string,
): Promise<LibraryChapterPagesResponse> {
  const { data } = await apiClient.get<LibraryChapterPagesResponse>(
    `/books/${bookId}/chapters/${chapterId}/pages`,
  );
  return data;
}

export async function getPageByOrder(bookId: string, order: number): Promise<{ page: LibraryPage }> {
  const { data } = await apiClient.get<{ page: LibraryPage }>(`/books/${bookId}/pages/${order}`);
  return data;
}

export async function upsertReadingProgress(
  bookId: string,
  body: LibraryProgressInput,
): Promise<LibraryReadingProgress> {
  const { data } = await apiClient.put<LibraryReadingProgress>(`/books/${bookId}/progress`, body);
  return data;
}

export async function listBookmarks(bookId: string): Promise<{ bookmarks: LibraryBookmark[] }> {
  const { data } = await apiClient.get<{ bookmarks: LibraryBookmark[] }>(
    `/books/${bookId}/bookmarks`,
  );
  return data;
}

export async function createBookmark(
  bookId: string,
  body: Omit<LibraryBookmark, 'id' | 'bookId' | 'createdAt'> & { note?: string },
): Promise<LibraryBookmark> {
  const { data } = await apiClient.post<LibraryBookmark>(`/books/${bookId}/bookmarks`, body);
  return data;
}

export async function deleteBookmark(
  bookId: string,
  bookmarkId: string,
): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete<{ deleted: boolean; id: string }>(
    `/books/${bookId}/bookmarks/${bookmarkId}`,
  );
  return data;
}

export type BookDownloadBundle = {
  version: number;
  bookId: string;
  bundleVersion: string;
  signature: string;
  generatedAt: string;
  sizeBytes: number;
  book: LibraryBookDetail['book'];
  chapters: LibraryBookDetail['chapters'];
  pages: {
    id: string;
    order: number;
    chapterId: string;
    chapterTitle: string;
    html: string;
    plainText: string;
  }[];
};

export type LibraryEventName =
  | 'book_open'
  | 'page_read'
  | 'explain_used'
  | 'read_aloud_start'
  | 'download'
  | 'download_delete';

export async function fetchBookDownload(bookId: string): Promise<BookDownloadBundle> {
  const { data } = await apiClient.get<BookDownloadBundle>(`/books/${bookId}/download`);
  return data;
}

export async function deleteBookDownload(bookId: string): Promise<{ deleted: boolean; bookId: string }> {
  const { data } = await apiClient.delete<{ deleted: boolean; bookId: string }>(
    `/books/${bookId}/download`,
  );
  return data;
}

export async function trackLibraryEvent(
  event: LibraryEventName,
  bookId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await apiClient.post('/books/events', { event, bookId, metadata });
  } catch {
    // Analytics should never block reading.
  }
}
