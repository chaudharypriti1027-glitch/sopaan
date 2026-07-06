/** Default model tier per AI feature (Sonnet = quality, Haiku = fast). */
export const FEATURE_MODEL_TIER = Object.freeze({
  test_generation: 'quality',
  answer_evaluation: 'quality',
  attempt_coaching: 'quality',
  doubt_solver: 'fast',
  current_affairs_summary: 'fast',
  home_ai_nudges: 'fast',
  readiness_focus: 'fast',
  planner_copy: 'fast',
  roadmap_tips: 'fast',
  book_generation: 'quality',
  book_explain: 'fast',
});

const DEFAULT_TIER = 'quality';

/**
 * Resolve the tier used for an AI call, optionally downgrading quality → fast when the global budget is exceeded.
 */
export function resolveEffectiveTier({ tier, feature, budgetExceeded = false }) {
  let effective = tier;

  if (!effective && feature) {
    effective = FEATURE_MODEL_TIER[feature] ?? DEFAULT_TIER;
  }

  if (!effective) {
    effective = DEFAULT_TIER;
  }

  if (budgetExceeded && effective === 'quality') {
    return 'fast';
  }

  return effective;
}
