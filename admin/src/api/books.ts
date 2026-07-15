import { apiRequest } from './client';

export type BookGenRequest = {
  title: string;
  subject: string;
  audience: string;
  chapters: string[];
  isPro?: boolean;
  coverTheme?: string;
  author?: string;
  description?: string;
  language?: string;
};

export type BookGenStartResponse = {
  bookId: string;
  jobId: string;
};

export type BookGenStatusResponse = {
  jobId: string;
  bookId: string;
  state: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  error: string | null;
  metrics?: {
    chaptersTotal?: number;
    chaptersDone?: number;
    chaptersFailed?: number;
  } | null;
};

export function generateAdminBook(body: BookGenRequest) {
  return apiRequest<BookGenStartResponse>('/api/admin/books/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchBookGenStatus(jobId: string) {
  return apiRequest<BookGenStatusResponse>(`/api/admin/books/${jobId}/status`);
}

export function publishAdminBook(bookId: string) {
  return apiRequest<{ book: { id: string; title: string; status: string } }>(
    `/api/admin/books/${bookId}/publish`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}
