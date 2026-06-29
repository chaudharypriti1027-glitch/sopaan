import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export type Book = {
  id: string;
  title: string;
  author?: string;
  subject?: string;
  rating?: number;
  link?: string;
  examId?: string;
  examName?: string;
  examCode?: string;
  category?: string;
};

type RawBook = Book & { _id?: string };

function normalizeBook(raw: RawBook): Book {
  return {
    id: raw.id ?? raw._id ?? raw.title,
    title: raw.title,
    author: raw.author,
    subject: raw.subject,
    rating: raw.rating,
    link: raw.link,
    examId: raw.examId?.toString?.() ?? raw.examId,
    examName: raw.examName,
    examCode: raw.examCode,
    category: raw.category,
  };
}

export async function listBooks(
  params?: PaginationParams & { subject?: string; examId?: string },
): Promise<PaginatedResponse<Book>> {
  const { data } = await apiClient.get<PaginatedResponse<RawBook>>('/books', { params });
  return { ...data, items: data.items.map(normalizeBook) };
}
