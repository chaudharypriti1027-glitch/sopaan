/** Server-driven experiment definitions — variants, weights, and client payloads. */
export const EXPERIMENT_KEYS = Object.freeze([
  'onboarding_variant',
  'paywall_copy',
  'home_layout',
]);

export const CONVERSION_EVENTS = Object.freeze([
  'assignment',
  'signup_complete',
  'onboarding_complete',
  'first_test',
  'trial_start',
  'paywall_view',
]);

export const EXPERIMENTS = Object.freeze({
  onboarding_variant: {
    key: 'onboarding_variant',
    variants: [
      { id: 'control', weight: 50 },
      { id: 'streamlined', weight: 50 },
    ],
    payload: {
      control: {
        title: 'Which exam are you preparing for?',
        subtitle: "Pick your track — we'll tailor your roadmap, mocks, and daily plan.",
        eyebrow: 'Choose exam',
        hint: 'You can add more exams later from your profile.',
      },
      streamlined: {
        title: 'Pick your exam track',
        subtitle: 'One choice now — we personalize mocks, planner, and readiness from day one.',
        eyebrow: 'Get started',
        hint: 'You can refine your goal anytime in Profile.',
      },
    },
  },
  paywall_copy: {
    key: 'paywall_copy',
    variants: [
      { id: 'control', weight: 34 },
      { id: 'urgency', weight: 33 },
      { id: 'value', weight: 33 },
    ],
    payload: {
      control: {
        heroTitle: 'Sopaan Pro',
        heroSub:
          'Secure checkout via Razorpay (UPI, cards, netbanking). Prices are set by our servers.',
        benefitsTitle: 'What you get',
        benefits: [
          'Unlimited AI doubt solving & answer evaluation',
          'Full mock test series with detailed analytics',
          'Priority mentor slots & live class replays',
          'Ad-free study planner & focus sessions',
          'Physical test tracker with AI fitness plans',
        ],
        trialCta: 'Start 7-day free trial',
        subscribeCta: 'Subscribe now',
      },
      urgency: {
        heroTitle: 'Unlock Pro before your next mock',
        heroSub:
          'Most toppers upgrade in their first week. Start your trial today — cancel anytime.',
        benefitsTitle: 'Why upgrade now',
        benefits: [
          'AI coach feedback right after every mock',
          'Unlimited mocks to climb the leaderboard faster',
          'Daily AI plan tuned to your weak topics',
          'Priority mentor slots before exam season fills up',
          '7-day free trial — no payment until you decide',
        ],
        trialCta: 'Start free trial today',
        subscribeCta: 'Go Pro now',
      },
      value: {
        heroTitle: 'Invest in your rank',
        heroSub:
          'AI coaching, unlimited mocks, and planner — less than a coffee per day on yearly.',
        benefitsTitle: 'Everything in Pro',
        benefits: [
          'Unlimited AI doubt solving & answer evaluation',
          'Full mock test series with detailed analytics',
          'Adaptive planner that learns from your mocks',
          'Focus sessions & wellness without ads',
          'Physical test tracker with AI fitness plans',
        ],
        trialCta: 'Try Pro free for 7 days',
        subscribeCta: 'Choose a plan',
      },
    },
  },
  home_layout: {
    key: 'home_layout',
    variants: [
      { id: 'control', weight: 34 },
      { id: 'compact', weight: 33 },
      { id: 'plan_first', weight: 33 },
    ],
    payload: {
      control: {
        sectionOrder: ['hero', 'plan', 'quickActions', 'flashcards', 'continue'],
        compactHero: false,
      },
      compact: {
        sectionOrder: ['hero', 'quickActions', 'plan', 'flashcards', 'continue'],
        compactHero: true,
      },
      plan_first: {
        sectionOrder: ['plan', 'hero', 'quickActions', 'flashcards', 'continue'],
        compactHero: false,
      },
    },
  },
});

export function getDefaultAssignments() {
  return Object.fromEntries(EXPERIMENT_KEYS.map((key) => [key, 'control']));
}

export function buildPayloadsForAssignments(assignments) {
  const payloads = {};

  for (const key of EXPERIMENT_KEYS) {
    const variant = assignments[key] ?? 'control';
    const experiment = EXPERIMENTS[key];
    payloads[key] = experiment?.payload?.[variant] ?? experiment?.payload?.control ?? {};
  }

  return payloads;
}
