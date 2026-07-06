import type { LibraryBook } from '../../api/books';
import type { CoverVariant, SubjectTone } from './libraryTheme';

const COVER_VARIANTS: CoverVariant[] = ['navy', 'gold', 'sage', 'deep', 'rust'];
const SUBJECT_TONES: SubjectTone[] = ['navy', 'gold', 'sage', 'rust'];

const SUBJECT_LABEL_KEYS: Record<string, string> = {
  quant: 'books.subjects.quant',
  reasoning: 'books.subjects.reasoning',
  english: 'books.subjects.english',
  gk: 'books.subjects.gk',
  current_affairs: 'books.subjects.current_affairs',
  static_gk: 'books.subjects.static_gk',
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function coverVariantForBook(book: LibraryBook): CoverVariant {
  if (book.coverTheme && COVER_VARIANTS.includes(book.coverTheme as CoverVariant)) {
    return book.coverTheme as CoverVariant;
  }
  return COVER_VARIANTS[hashString(book.id || book.title) % COVER_VARIANTS.length];
}

export function subjectLabelKey(subject: string): string {
  return SUBJECT_LABEL_KEYS[subject] ?? 'books.subjects.general';
}

export function subjectToneForLabel(label: string, index = 0): SubjectTone {
  return SUBJECT_TONES[(hashString(label) + index) % SUBJECT_TONES.length];
}

export function progressPercentForBook(book: LibraryBook): number {
  return book.progressPercent ?? 0;
}

export function pagesLeftForBook(book: LibraryBook): number {
  if (!book.pages || book.progressPercent == null) {
    return book.pages ?? 0;
  }
  return Math.max(0, Math.round(book.pages * (1 - book.progressPercent / 100)));
}

export function pseudoProgress(id: string): number {
  return 35 + (hashString(id) % 50);
}

export function pseudoPagesLeft(id: string): number {
  return 18 + (hashString(id) % 80);
}

export function pseudoFileSizeMb(id: string): string {
  const value = (0.8 + (hashString(id) % 20) / 10).toFixed(1);
  return `${value} MB`;
}

export function pseudoPageCount(id: string): number {
  return 12 + (hashString(id) % 60);
}

export function isProBook(book: LibraryBook): boolean {
  return Boolean(book.isPro);
}

export function isDownloadedBook(book: LibraryBook): boolean {
  return Boolean(book.isDownloaded);
}

export type SubjectGroup = {
  subject: string;
  labelKey: string;
  count: number;
  tone: SubjectTone;
};

export function mapSubjectCounts(
  subjects: { subject: string; count: number }[],
): SubjectGroup[] {
  return subjects.map((row, index) => ({
    subject: row.subject,
    labelKey: subjectLabelKey(row.subject),
    count: row.count,
    tone: subjectToneForLabel(row.subject, index),
  }));
}

export function pickContinueBook(books: LibraryBook[]): LibraryBook | null {
  const inProgress = books.filter((book) => book.inProgress);
  if (!inProgress.length) {
    return null;
  }

  return [...inProgress].sort(
    (a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0),
  )[0];
}

export function mergeBookDownloadState(
  book: LibraryBook,
  localDownloadIds: ReadonlySet<string>,
): LibraryBook {
  return {
    ...book,
    isDownloaded: book.isDownloaded || localDownloadIds.has(book.id),
  };
}

export function pickFeaturedBook(books: LibraryBook[]): LibraryBook | null {
  if (!books.length) return null;
  return [...books].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;
}

export function pickTopRatedBooks(books: LibraryBook[], limit = 12): LibraryBook[] {
  return [...books].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, limit);
}
