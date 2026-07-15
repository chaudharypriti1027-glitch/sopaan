import { describe, expect, it } from '@jest/globals';
import { createMockHomeFeed } from '../../test/fixtures/homeFeed';
import {
  HOME_AI_ACTION_TILES,
  HOME_COACH_PROMPTS,
  HOME_EXPLORE_GRID,
  HOME_SECTION_META,
  HOME_SECTION_ORDER,
  resolveHomeSectionVisibility,
  visibleHomeSections,
} from '../homeContent';

describe('homeContent', () => {
  it('keeps canonical section order', () => {
    expect(HOME_SECTION_ORDER[0]).toBe('continue');
    expect(HOME_SECTION_ORDER[3]).toBe('features');
    expect(HOME_SECTION_ORDER.at(-1)).toBe('league');
  });

  it('hides completed daily challenge', () => {
    const feed = createMockHomeFeed({
      dailyChallenge: {
        id: 'daily-1',
        testId: 'test-daily-1',
        title: 'Daily drill',
        qCount: 10,
        rewardCoins: 50,
        status: 'done',
      },
    });

    expect(resolveHomeSectionVisibility(feed).dailyChallenge).toBe(false);
    expect(visibleHomeSections(feed)).not.toContain('dailyChallenge');
  });

  it('always shows explore and AI coach sections', () => {
    const feed = createMockHomeFeed({ aiNudges: [], quickActions: [] });
    const visibility = resolveHomeSectionVisibility(feed);

    expect(visibility.features).toBe(true);
    expect(visibility.nudges).toBe(true);
  });

  it('defines subtitles and panel tones for premium sections', () => {
    expect(HOME_SECTION_META.features.subtitleKey).toBe('exploreSubtitle');
    expect(HOME_SECTION_META.nudges.titleKey).toBe('aiActionsTitle');
    expect(HOME_SECTION_META.league.panelTone).toBe(false);
    expect(HOME_SECTION_META.features.panelTone).toBe(false);
    expect(HOME_SECTION_META.continue.compactWhenFirst).toBe(true);
  });

  it('lists AI action tiles and coach prompts', () => {
    expect(HOME_AI_ACTION_TILES.map((tile) => tile.key)).toEqual([
      'generate',
      'games',
      'ask',
      'plan',
    ]);
    expect(HOME_COACH_PROMPTS.length).toBeGreaterThanOrEqual(4);
  });

  it('uses a dense 3-column explore feature grid', () => {
    expect(HOME_EXPLORE_GRID).toEqual({
      columns: 3,
      cardPad: 10,
      tileGap: 4,
      rowGap: 8,
    });
  });
});
