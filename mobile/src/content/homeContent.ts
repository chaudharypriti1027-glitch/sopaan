import type { LucideIcon } from 'lucide-react-native';
import { Gamepad2, ListChecks, MessageCircle, Sparkles } from 'lucide-react-native';
import type { HomeFeatureSectionKey } from '../navigation/homeFeatureConfig';
import type { HomeFeed } from '../types/home';

/** Canonical home feed section order (below hero). Explore first; AI hub before league. */
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

export type HomeSectionPanelTone = 'default' | 'gold' | false;

export type HomeSectionMeta = {
  testId: string;
  titleKey: string;
  subtitleKey?: string;
  actionKey?: string;
  compactWhenFirst?: boolean;
  padded?: boolean;
  /** Wrap section body in a raised panel — false when the child already has its own card. */
  panelTone?: HomeSectionPanelTone;
};

export const HOME_SECTION_META: Record<HomeSectionKey, HomeSectionMeta> = {
  features: {
    testId: 'home-section-features',
    titleKey: 'explore',
    subtitleKey: 'exploreSubtitle',
    compactWhenFirst: true,
    padded: true,
    panelTone: false,
  },
  nudges: {
    testId: 'home-section-nudges',
    titleKey: 'aiActionsTitle',
    subtitleKey: 'aiActionsSubtitle',
    padded: true,
    panelTone: false,
  },
  dailyChallenge: {
    testId: 'home-section-daily-challenge',
    titleKey: 'dailyChallenge',
    subtitleKey: 'dailyChallengeSubtitle',
    padded: true,
    panelTone: 'default',
  },
  continue: {
    testId: 'home-section-continue',
    titleKey: 'continueLearning',
    subtitleKey: 'continueSubtitle',
    actionKey: 'seeAll',
    padded: true,
    panelTone: 'default',
  },
  recommended: {
    testId: 'home-section-recommended',
    titleKey: 'recommendedTests',
    subtitleKey: 'recommendedSubtitle',
    actionKey: 'seeAll',
    padded: true,
    panelTone: 'default',
  },
  affairs: {
    testId: 'home-section-affairs',
    titleKey: 'todaysAffairs',
    subtitleKey: 'affairsSubtitle',
    actionKey: 'allAffairs',
    padded: true,
    panelTone: 'default',
  },
  league: {
    testId: 'home-section-league',
    titleKey: 'yourLeague',
    subtitleKey: 'leagueSubtitle',
    padded: true,
    panelTone: 'gold',
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

/** Staggered enter animation for feed sections. */
export const HOME_SECTION_MOTION = {
  baseMs: 260,
  staggerMs: 35,
  maxStaggerIndex: 4,
} as const;

/** Explore hub tab labels — keys under `app:home.*`. */
export const HOME_EXPLORE_TAB_LABEL_KEYS: Record<HomeFeatureSectionKey, string> = {
  learning: 'exploreTabLearning',
  prep: 'exploreTabPrep',
  community: 'exploreTabCommunity',
  tools: 'exploreTabTools',
};

export const HOME_EXPLORE_GRID = {
  columns: 5,
  cardPad: 12,
  tileGap: 6,
} as const;

export type HomeAiActionKey = 'generate' | 'games' | 'ask' | 'plan';

export type HomeAiActionTileConfig = {
  key: HomeAiActionKey;
  labelKey: string;
  subtitleKey: string;
  gradient: readonly [string, string];
  Icon: LucideIcon;
  testID: string;
};

/** AI study hub quick actions — labels via `app:home.<labelKey>`. */
export const HOME_AI_ACTION_TILES: HomeAiActionTileConfig[] = [
  {
    key: 'generate',
    labelKey: 'aiActionGenerate',
    subtitleKey: 'aiActionGenerateSub',
    gradient: ['#F0D48A', '#C29A4E'],
    Icon: ListChecks,
    testID: 'home-ai-action-generate',
  },
  {
    key: 'games',
    labelKey: 'aiActionGames',
    subtitleKey: 'aiActionGamesSub',
    gradient: ['#8BAEA0', '#5F8A7B'],
    Icon: Gamepad2,
    testID: 'home-ai-action-games',
  },
  {
    key: 'ask',
    labelKey: 'aiActionAsk',
    subtitleKey: 'aiActionAskSub',
    gradient: ['#9AA3D4', '#5C6BC0'],
    Icon: MessageCircle,
    testID: 'home-ai-action-ask',
  },
  {
    key: 'plan',
    labelKey: 'aiActionPlan',
    subtitleKey: 'aiActionPlanSub',
    gradient: ['#E3C97F', '#A67C33'],
    Icon: Sparkles,
    testID: 'home-ai-action-plan',
  },
];

export type HomeCoachPromptAction = 'ask' | 'examPlan' | 'practice' | 'games';

export type HomeCoachPromptConfig = {
  key: string;
  icon: string;
  tone: 'gold' | 'mint' | 'lavender' | 'coral';
  action: HomeCoachPromptAction;
};

/** Coach quick prompts when the feed has few AI nudges. */
export const HOME_COACH_PROMPTS: HomeCoachPromptConfig[] = [
  { key: 'coachPromptGenerate', icon: 'clipboard-list', tone: 'gold', action: 'practice' },
  { key: 'coachPromptGames', icon: 'gamepad-2', tone: 'mint', action: 'games' },
  { key: 'coachPromptPlan', icon: 'target', tone: 'lavender', action: 'examPlan' },
  { key: 'coachPromptWeak', icon: 'brain', tone: 'lavender', action: 'ask' },
  { key: 'coachPromptCa', icon: 'newspaper', tone: 'coral', action: 'ask' },
  { key: 'coachPromptExamPlan', icon: 'calendar', tone: 'mint', action: 'examPlan' },
];

export const HOME_PREMIUM_STRIP = {
  titleKey: 'premiumStripTitle',
  subtitleKey: 'premiumStripSubtitle',
  ctaKey: 'premiumStripCta',
  testID: 'home-explore-premium',
} as const;
