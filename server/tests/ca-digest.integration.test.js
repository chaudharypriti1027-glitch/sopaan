import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { CurrentAffair } from '../src/models/CurrentAffair.js';
import { CurrentAffairDigest } from '../src/models/CurrentAffairDigest.js';
import { runDailyCaDigest } from '../src/services/currentAffairs/currentAffairDigestService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

describe('daily CA digest service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('skips when no sources are enabled', async () => {
    process.env.CA_DIGEST_SOURCES = '[]';

    const result = await runDailyCaDigest({ date: new Date('2026-06-26T10:00:00Z') });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('no enabled sources');
  });

  it('does not re-ingest the same feed item twice', async () => {
    await CurrentAffair.create({
      title: 'Existing headline',
      summary: 'Already ingested summary for duplicate protection.',
      category: 'National',
      source: 'Test Source',
      feedSourceId: 'test-source',
      feedItemId: 'feed-item-1',
      publishedAt: new Date('2026-06-26T08:00:00Z'),
      status: 'published',
    });

    process.env.CA_DIGEST_SOURCES = JSON.stringify([
      {
        id: 'test-source',
        name: 'Test Source',
        feedUrl: 'https://example.test/rss',
        enabled: true,
        maxItemsPerRun: 5,
      },
    ]);

    const digest = await CurrentAffairDigest.create({
      digestDate: new Date('2026-06-26T00:00:00Z'),
      title: 'Daily CA Digest — 26 Jun 2026',
      affairs: [],
      itemCount: 0,
      status: 'draft',
    });

    const exists = await CurrentAffair.findOne({
      feedSourceId: 'test-source',
      feedItemId: 'feed-item-1',
    }).lean();

    expect(exists).toBeTruthy();
    expect(digest.itemCount).toBe(0);
  });
});
