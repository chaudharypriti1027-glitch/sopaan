import { getRealtimeIo } from '../realtime/io.js';
import { SOCKET_EVENTS } from '../realtime/events.js';
import { logger } from '../observability/logger.js';
import { bustLibraryCache } from './libraryService.js';

export const CONTENT_DOMAINS = Object.freeze({
  LIVE_CLASSES: 'live-classes',
  COURSES: 'courses',
  BOOKS: 'books',
  CURRENT_AFFAIRS: 'current-affairs',
  EXAMS: 'exams',
  TESTS: 'tests',
  BANNERS: 'banners',
  HOME: 'home',
});

/** Push a realtime signal so connected student apps refetch fresh content. */
export function notifyStudentsContentUpdated(domain, meta = {}) {
  const payload = {
    domain,
    ...meta,
    updatedAt: new Date().toISOString(),
  };

  const io = getRealtimeIo();
  if (io) {
    io.emit(SOCKET_EVENTS.CONTENT_UPDATED, payload);
  }

  if (domain === CONTENT_DOMAINS.BOOKS) {
    bustLibraryCache().catch((err) => {
      logger.warn('library cache bust failed', { message: err?.message ?? String(err) });
    });
  }
}
