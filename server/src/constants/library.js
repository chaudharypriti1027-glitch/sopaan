export const BOOK_SUBJECTS = [
  'quant',
  'reasoning',
  'english',
  'gk',
  'current_affairs',
  'static_gk',
];

export const BOOK_COVER_THEMES = ['navy', 'gold', 'sage', 'deep', 'rust'];

export const BOOK_STATUSES = ['draft', 'published'];

export const BOOK_SOURCES = ['human', 'ai'];

export const BOOK_GEN_JOB_STATES = ['queued', 'running', 'done', 'failed'];

/** Tags that classify a book as a note/PDF resource in list filters. */
export const BOOK_NOTE_TAGS = ['pdf', 'note', 'notes'];

/** Number of preview pages returned for Pro books without an active subscription. */
export const PRO_BOOK_PREVIEW_PAGES = 2;

/** Maximum chapters per AI generation request. */
export const MAX_BOOK_GEN_CHAPTERS = 20;

/** Maximum concurrent queued + running book generation jobs. */
export const MAX_CONCURRENT_BOOK_GEN_JOBS = 3;
