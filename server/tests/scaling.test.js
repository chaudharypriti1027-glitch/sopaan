import { describe, expect, it } from '@jest/globals';
import { parsePagination, buildPaginatedResult } from '../src/utils/pagination.js';
import { stableCacheKey } from '../src/lib/cache.js';
import { CACHE_TTLS } from '../src/config/cacheConfig.js';

describe('scaling utilities', () => {
  it('caps pagination limit at max', () => {
    const { limit, offset } = parsePagination({ limit: '500', offset: '0' }, { maxLimit: 50 });
    expect(limit).toBe(50);
    expect(offset).toBe(0);
  });

  it('builds paginated results with hasMore', () => {
    const result = buildPaginatedResult({ items: [1, 2], total: 10, limit: 2, offset: 0 });
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.total).toBe(10);
  });

  it('creates stable cache keys for identical payloads', () => {
    const a = stableCacheKey('cache:test', { limit: 20, offset: 0 });
    const b = stableCacheKey('cache:test', { offset: 0, limit: 20 });
    expect(a).toBe(b);
  });

  it('defines cache TTL defaults', () => {
    expect(CACHE_TTLS.examCalendarSec).toBeGreaterThan(0);
    expect(CACHE_TTLS.leaderboardSec).toBeGreaterThan(0);
  });
});
