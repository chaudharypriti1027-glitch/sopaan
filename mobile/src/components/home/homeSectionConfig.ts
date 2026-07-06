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
  /** Tighter header spacing when this is the first visible block under the hero. */
  compactWhenFirst?: boolean;
  /** Soft highlight panel when first under the hero (explore hub). */
  highlightWhenFirst?: boolean;
  padded?: boolean;
  /** Wrap section body in premium elevated panel. */
  panel?: boolean;
  panelTone?: 'default' | 'gold';
};

export const HOME_SECTION_META: Record<HomeSectionKey, HomeSectionMeta> = {
  features: {
    testId: 'home-section-features',
    titleKey: 'explore',
    subtitleKey: 'exploreSubtitle',
    compactWhenFirst: true,
    highlightWhenFirst: true,
    padded: true,
  },
  nudges: {
    testId: 'home-section-nudges',
    titleKey: 'forYou',
    subtitleKey: 'aiHubSubtitle',
    padded: true,
    panel: true,
    panelTone: 'gold',
  },
  dailyChallenge: {
    testId: 'home-section-daily-challenge',
    titleKey: 'dailyChallenge',
    subtitleKey: 'dailyChallengeSubtitle',
    padded: true,
    panel: true,
  },
  continue: {
    testId: 'home-section-continue',
    titleKey: 'continueLearning',
    subtitleKey: 'continueSubtitle',
    actionKey: 'seeAll',
    padded: true,
    panel: true,
  },
  recommended: {
    testId: 'home-section-recommended',
    titleKey: 'recommendedTests',
    subtitleKey: 'recommendedSubtitle',
    actionKey: 'seeAll',
    padded: true,
    panel: true,
  },
  affairs: {
    testId: 'home-section-affairs',
    titleKey: 'todaysAffairs',
    subtitleKey: 'affairsSubtitle',
    actionKey: 'allAffairs',
    padded: true,
    panel: true,
  },
  league: {
    testId: 'home-section-league',
    titleKey: 'yourLeague',
    subtitleKey: 'leagueSubtitle',
    padded: true,
    panel: true,
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
