import type { HomeFeed } from '../../types/home';

/** Canonical home feed section order (below hero). */
export const HOME_SECTION_ORDER = [
  'nudges',
  'features',
  'dailyChallenge',
  'continue',
  'recommended',
  'affairs',
  'league',
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_ORDER)[number];

export type HomeSectionVisibility = Record<HomeSectionKey, boolean>;

export function resolveHomeSectionVisibility(feed: HomeFeed): HomeSectionVisibility {
  const hasNudges = feed.aiNudges.length > 0;
  const dailyTodo =
    feed.dailyChallenge != null && feed.dailyChallenge.status === 'todo';

  return {
    nudges: hasNudges,
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
