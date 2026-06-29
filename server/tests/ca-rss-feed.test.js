import { describe, expect, it } from '@jest/globals';
import {
  filterRecentFeedItems,
  parseSyndicationFeed,
  truncateSnippet,
} from '../src/services/currentAffairs/rssFeedClient.js';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>India launches new skill development scheme</title>
      <link>https://example.gov.in/release/1</link>
      <guid>release-1</guid>
      <pubDate>Fri, 26 Jun 2026 08:00:00 GMT</pubDate>
      <description>The scheme targets youth employment with new training centres.</description>
    </item>
    <item>
      <title>RBI keeps repo rate unchanged</title>
      <link>https://example.gov.in/release/2</link>
      <pubDate>Thu, 25 Jun 2026 12:00:00 GMT</pubDate>
      <description>Monetary policy committee held rates steady at 6.5 percent.</description>
    </item>
  </channel>
</rss>`;

describe('rss feed client', () => {
  it('parses RSS items with title, link, and description', () => {
    const items = parseSyndicationFeed(SAMPLE_RSS);

    expect(items).toHaveLength(2);
    expect(items[0].title).toContain('skill development');
    expect(items[0].link).toBe('https://example.gov.in/release/1');
    expect(items[0].description).toContain('training centres');
    expect(items[0].itemId).toHaveLength(32);
  });

  it('filters items by max age', () => {
    const items = parseSyndicationFeed(SAMPLE_RSS).map((item, index) => ({
      ...item,
      publishedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    }));

    const recent = filterRecentFeedItems(items, { maxAgeHours: 12, now: new Date() });
    expect(recent).toHaveLength(1);
  });

  it('truncates long snippets', () => {
    const snippet = truncateSnippet('a'.repeat(100), 40);
    expect(snippet.length).toBeLessThanOrEqual(40);
    expect(snippet.endsWith('…')).toBe(true);
  });
});
