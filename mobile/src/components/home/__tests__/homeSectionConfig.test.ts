import { describe, expect, it } from '@jest/globals';
import { createMockHomeFeed } from '../../../test/fixtures/homeFeed';
import { resolveHomeSectionVisibility, visibleHomeSections, HOME_SECTION_META } from '../homeSectionConfig';

describe('homeSectionConfig', () => {
  it('orders visible sections and hides completed daily challenge', () => {
    const feed = createMockHomeFeed({
      dailyChallenge: {
        id: 'daily-1',
        title: 'Daily drill',
        qCount: 10,
        rewardCoins: 50,
        status: 'done',
      },
    });

    const visibility = resolveHomeSectionVisibility(feed);
    expect(visibility.dailyChallenge).toBe(false);

    const sections = visibleHomeSections(feed);
    expect(sections.indexOf('dailyChallenge')).toBe(-1);
    expect(sections[0]).toBe('features');
    expect(sections).toContain('nudges');
    expect(sections[sections.length - 1]).toBe('league');
    expect(sections[sections.length - 2]).toBe('nudges');
    expect(sections).toContain('affairs');
  });

  it('always includes the explore features hub', () => {
    const feed = createMockHomeFeed({ aiNudges: [], quickActions: [] });
    expect(resolveHomeSectionVisibility(feed).features).toBe(true);
    expect(visibleHomeSections(feed)).toContain('features');
  });

  it('always includes the AI coach section even without nudges', () => {
    const feed = createMockHomeFeed({ aiNudges: [] });
    expect(resolveHomeSectionVisibility(feed).nudges).toBe(true);
    expect(visibleHomeSections(feed)).toContain('nudges');
  });

  it('shows daily challenge when still todo', () => {
    const feed = createMockHomeFeed({
      dailyChallenge: {
        id: 'daily-1',
        title: 'Daily drill',
        qCount: 10,
        rewardCoins: 50,
        status: 'todo',
      },
    });

    expect(resolveHomeSectionVisibility(feed).dailyChallenge).toBe(true);
    expect(visibleHomeSections(feed)).toContain('dailyChallenge');
  });

  it('exposes section metadata for feed rendering', () => {
    expect(HOME_SECTION_META.features.titleKey).toBe('explore');
    expect(HOME_SECTION_META.features.compactWhenFirst).toBe(true);
    expect(HOME_SECTION_META.nudges.titleKey).toBe('forYou');
    expect(HOME_SECTION_META.continue.actionKey).toBe('seeAll');
  });
});
