import { describe, expect, it } from '@jest/globals';
import {
  countNewsApiKeywordSlots,
  fetchNewsApiArticles,
  parseNewsApiId,
} from '../src/services/currentAffairs/newsApiAiClient.js';

describe('newsApiAiClient', () => {
  it('parseNewsApiId extracts external uri and state', () => {
    expect(parseNewsApiId('newsapi:9375404764')).toEqual({
      uri: '9375404764',
      state: 'National',
    });
    expect(parseNewsApiId('newsapi:9375404764|Gujarat')).toEqual({
      uri: '9375404764',
      state: 'Gujarat',
    });
    expect(parseNewsApiId('mongo-id')).toBeNull();
  });

  it('keeps keyword filters within NewsAPI subscription limit', () => {
    expect(countNewsApiKeywordSlots()).toBeLessThanOrEqual(15);
  });

  it('maps articles when API key is configured', async () => {
    if (!process.env.NEWSAPI_AI_KEY) {
      return;
    }

    const result = await fetchNewsApiArticles({
      limit: 3,
      offset: 0,
      month: '2026-06',
      state: 'Gujarat',
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.items[0].id).toMatch(/^newsapi:/);
    expect(result.items[0].title).toBeTruthy();
    expect(result.items[0].publishedAt).toBeTruthy();
  });
});
