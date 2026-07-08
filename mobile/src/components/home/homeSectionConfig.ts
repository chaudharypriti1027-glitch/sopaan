import type { HomeFeed } from '../../types/home';

/** Canonical home feed section order (below hero). Explore first; AI near the end. */
export const HOME_SECTION_ORDER = [
  'features',
  'dailyChallenge',
  'continue',
  'recommended',
  'affairs',
  'nudges',
  'league',
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_ORDER)[number];

export type HomeSectionVisibility = Record<HomeSectionKey, boolean>;

export type HomeSectionMeta = {
  testId: string;
  titleKey?: string;
  subtitleKey?: string;
  actionKey?: string;
  compactWhenFirst?: boolean;
  padded?: boolean;
};

export const HOME_SECTION_META: Record<HomeSectionKey, HomeSectionMeta> = {
  features: {
    testId: 'home-section-features',
    titleKey: 'explore',
    compactWhenFirst: true,
    padded: true,
  },
  nudges: {
    testId: 'home-section-nudges',
    titleKey: 'forYou',
    padded: true,
  },
  dailyChallenge: {
    testId: 'home-section-daily-challenge',
    titleKey: 'dailyChallenge',
    padded: true,
  },
  continue: {
    testId: 'home-section-continue',
    titleKey: 'continueLearning',
    actionKey: 'seeAll',
    padded: true,
  },
  recommended: {
    testId: 'home-section-recommended',
    titleKey: 'recommendedTests',
    actionKey: 'seeAll',
    padded: true,
  },
  affairs: {
    testId: 'home-section-affairs',
    titleKey: 'todaysAffairs',
    actionKey: 'allAffairs',
    padded: true,
  },
  league: {
    testId: 'home-section-league',
    titleKey: 'yourLeague',
    padded: true,
  },
};

export function resolveHomeSectionVisibility(feed: HomeFeed): HomeSectionVisibility {
  const dailyTodo =
    feed.dailyChallenge != null && feed.dailyChallenge.status === 'todo';

  return {
    nudges: true,
    features: true,
    dailyChallenge: dailyTodo,
    continue: feed.continue.length > 0,
    recommended: feed.recommendedTests.length > 0,
    affairs: feed.currentAffairs.length > 0,
    league: feed.league != null,
  };
}

export function visibleHomeSections(feed: HomeFeed): HomeSectionKey[] {
  const visibility = resolveHomeSectionVisibility(feed);
  return HOME_SECTION_ORDER.filter((key) => visibility[key]);
}
