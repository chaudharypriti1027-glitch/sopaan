import crypto from 'crypto';
import { AppError } from '../../utils/AppError.js';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_FEED_BYTES = 1_5 * 1024 * 1024;

function decodeXmlEntities(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeXmlEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function readTag(block, tagNames) {
  for (const tag of tagNames) {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));

    if (match) {
      return decodeXmlEntities(match[1].trim());
    }
  }

  return '';
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildItemId(link, guid, title) {
  const basis = guid || link || title;

  return crypto.createHash('sha256').update(basis).digest('hex').slice(0, 32);
}

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match = itemRegex.exec(xml);

  while (match) {
    const block = match[1];
    const title = stripTags(readTag(block, ['title']));
    const link = stripTags(readTag(block, ['link']));
    const guid = stripTags(readTag(block, ['guid', 'id']));
    const description = stripTags(readTag(block, ['description', 'summary', 'content']));
    const pubDate = parseDate(readTag(block, ['pubDate', 'published', 'updated']));

    if (title) {
      items.push({
        title,
        link: link || undefined,
        guid: guid || undefined,
        description,
        publishedAt: pubDate,
        itemId: buildItemId(link, guid, title),
      });
    }

    match = itemRegex.exec(xml);
  }

  return items;
}

function parseAtomEntries(xml) {
  const items = [];
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let match = entryRegex.exec(xml);

  while (match) {
    const block = match[1];
    const title = stripTags(readTag(block, ['title']));
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/i);
    const link = linkMatch?.[1] ?? stripTags(readTag(block, ['link']));
    const guid = stripTags(readTag(block, ['id']));
    const description = stripTags(readTag(block, ['summary', 'content']));
    const pubDate = parseDate(readTag(block, ['published', 'updated']));

    if (title) {
      items.push({
        title,
        link: link || undefined,
        guid: guid || undefined,
        description,
        publishedAt: pubDate,
        itemId: buildItemId(link, guid, title),
      });
    }

    match = entryRegex.exec(xml);
  }

  return items;
}

export function parseSyndicationFeed(xml) {
  const normalized = xml.trim();

  if (!normalized) {
    return [];
  }

  if (/<feed[\s>]/i.test(normalized)) {
    return parseAtomEntries(normalized);
  }

  return parseRssItems(normalized);
}

export async function fetchSyndicationFeed(feedUrl, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'Sopaan-CA-Digest/1.0 (+https://sopaan.app)',
      },
    });

    if (!response.ok) {
      throw new AppError(`Feed request failed (${response.status})`, 502, 'FEED_FETCH_FAILED');
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_FEED_BYTES) {
      throw new AppError('Feed response too large', 502, 'FEED_TOO_LARGE');
    }

    const xml = new TextDecoder('utf-8').decode(buffer);
    return parseSyndicationFeed(xml);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('Feed request timed out', 504, 'FEED_TIMEOUT');
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function filterRecentFeedItems(items, { maxAgeHours = 36, now = new Date() } = {}) {
  const cutoff = now.getTime() - maxAgeHours * 60 * 60 * 1000;

  return items.filter((item) => {
    if (!item.publishedAt) {
      return true;
    }

    return item.publishedAt.getTime() >= cutoff;
  });
}

export function truncateSnippet(text, maxChars) {
  if (!text) {
    return '';
  }

  const trimmed = text.trim();

  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxChars - 1).trim()}…`;
}
