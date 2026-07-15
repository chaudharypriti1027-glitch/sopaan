import type { ExperimentAssignments, ExperimentPayloads } from '../api/experiments';

export const DEFAULT_EXPERIMENT_ASSIGNMENTS: ExperimentAssignments = {
  onboarding_variant: 'control',
  paywall_copy: 'control',
  home_layout: 'control',
};

export const DEFAULT_EXPERIMENT_PAYLOADS: ExperimentPayloads = {
  onboarding_variant: {
    title: 'Which exam are you preparing for?',
    subtitle: "Pick your track — we'll tailor your roadmap, mocks, and daily plan.",
    eyebrow: 'Choose exam',
    hint: 'You can add more exams later from your profile.',
  },
  paywall_copy: {
    heroTitle: 'Sopaan Pro',
    heroSub: 'Unlimited AI, mocks, and analytics — built for serious exam prep.',
    benefitsTitle: 'What you get',
    benefits: [
      'Unlimited AI doubt solving & answer evaluation',
      'Full mock test series with detailed analytics',
      'Priority mentor slots & live class replays',
      'Ad-free study planner & focus sessions',
      'Physical test tracker with AI fitness plans',
    ],
    trialCta: 'Claim 1 month free',
    subscribeCta: 'Subscribe now',
  },
  home_layout: {
    sectionOrder: ['hero', 'plan', 'quickActions', 'flashcards', 'continue'],
    compactHero: false,
  },
};

export type HomeSectionKey = 'hero' | 'plan' | 'quickActions' | 'flashcards' | 'continue';

export function isHomeSectionKey(value: string): value is HomeSectionKey {
  return ['hero', 'plan', 'quickActions', 'flashcards', 'continue'].includes(value);
}
