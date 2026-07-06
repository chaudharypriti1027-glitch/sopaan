import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'b',
  'i',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
];

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/** Strip unsafe markup — only headings, paragraphs, inline emphasis, lists, blockquote, code. */
export function sanitizeBookHtml(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  }

  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}
