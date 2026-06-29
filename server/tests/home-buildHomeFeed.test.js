import { describe, expect, it } from '@jest/globals';
import { HOME_SECTION_DEFAULTS } from '../src/services/home/buildHomeFeed.js';

describe('buildHomeFeed defaults', () => {
  it('defines safe fallbacks for every home section', () => {
    expect(HOME_SECTION_DEFAULTS.greeting).toMatchObject({
      name: expect.any(String),
      message: expect.any(String),
      unreadCount: expect.any(Number),
    });
    expect(HOME_SECTION_DEFAULTS.streak.todayDone).toBe(false);
    expect(HOME_SECTION_DEFAULTS.continue).toEqual([]);
    expect(HOME_SECTION_DEFAULTS.aiNudges.length).toBeGreaterThanOrEqual(1);
    expect(HOME_SECTION_DEFAULTS.countdown).toBeNull();
    expect(HOME_SECTION_DEFAULTS.league).toBeNull();
  });
});
