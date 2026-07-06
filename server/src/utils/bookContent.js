import { sanitizeBookHtml } from '../utils/sanitizeBookHtml.js';

/** Strip tags for Page.plainText search / indexing. */
export function htmlToPlainText(html) {
  const sanitized = sanitizeBookHtml(html);
  return sanitized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyBookTitle(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

  return base || 'book';
}
