/** Server-driven free vs Pro limits — tune via env without app redeploy. */
export const FREE_TIER_LIMITS = Object.freeze({
  aiGenerateTestsPerDay: Number(process.env.FREE_AI_TESTS_PER_DAY ?? 2),
  aiDoubtsFastPerDay: Number(process.env.FREE_AI_DOUBTS_PER_DAY ?? 10),
  aiDoubtsQualityPerDay: Number(process.env.FREE_AI_QUALITY_DOUBTS_PER_DAY ?? 2),
  aiEvaluationsPerDay: Number(process.env.FREE_AI_EVALUATIONS_PER_DAY ?? 0),
  mocksPerDay: Number(process.env.FREE_MOCKS_PER_DAY ?? 3),
  showAds: process.env.FREE_SHOW_ADS !== 'false',
  detailedAnalytics: process.env.FREE_DETAILED_ANALYTICS === 'true',
});

export const PRO_TIER_LIMITS = Object.freeze({
  aiGenerateTestsPerDay: Number(process.env.PRO_AI_TESTS_PER_DAY ?? 999),
  aiDoubtsFastPerDay: Number(process.env.PRO_AI_DOUBTS_PER_DAY ?? 200),
  aiDoubtsQualityPerDay: Number(process.env.PRO_AI_QUALITY_DOUBTS_PER_DAY ?? 50),
  aiEvaluationsPerDay: Number(process.env.PRO_AI_EVALUATIONS_PER_DAY ?? 999),
  mocksPerDay: Number(process.env.PRO_MOCKS_PER_DAY ?? 999),
  showAds: false,
  detailedAnalytics: true,
});

/** Canonical feature keys used by middleware, quota service, and mobile hook. */
export const TIER_FEATURE_KEYS = Object.freeze([
  'ai_generate_test',
  'ai_doubt',
  'ai_evaluate',
  'mock_submit',
  'detailed_analytics',
]);

export const TIER_FEATURES = Object.freeze({
  ai_generate_test: {
    type: 'quota',
    limitKey: 'aiGenerateTestsPerDay',
    paywallTitle: 'Unlock unlimited AI tests',
    paywallMessage:
      'Free users can generate a limited number of AI tests each day. Upgrade to Sopaan Pro for unlimited AI test generation.',
  },
  ai_doubt: {
    type: 'quota',
    limitKey: 'aiDoubtsFastPerDay',
    paywallTitle: 'Unlock unlimited AI doubt solving',
    paywallMessage:
      'You have reached today’s free AI doubt limit. Upgrade to Sopaan Pro for unlimited Ask AI.',
  },
  ai_evaluate: {
    type: 'quota',
    limitKey: 'aiEvaluationsPerDay',
    paywallTitle: 'Unlock AI answer evaluation',
    paywallMessage:
      'You have reached today’s free AI evaluation limit. Upgrade to Sopaan Pro for unlimited answer scoring and feedback.',
  },
  mock_submit: {
    type: 'quota',
    limitKey: 'mocksPerDay',
    paywallTitle: 'Unlock unlimited mocks',
    paywallMessage:
      'Free users can take a limited number of mocks per day. Upgrade to Sopaan Pro for unlimited practice.',
  },
  detailed_analytics: {
    type: 'pro_only',
    paywallTitle: 'Unlock detailed analytics',
    paywallMessage:
      'See accuracy trends, subject mastery, and study-hour charts with Sopaan Pro.',
  },
});

export function getTierLimits(isPro) {
  return isPro ? PRO_TIER_LIMITS : FREE_TIER_LIMITS;
}

export function getFeaturePaywallCopy(featureKey) {
  const feature = TIER_FEATURES[featureKey];
  if (!feature) {
    return {
      title: 'Upgrade to Sopaan Pro',
      message: 'Unlock unlimited AI, mocks, and detailed analytics.',
    };
  }

  return {
    title: feature.paywallTitle,
    message: feature.paywallMessage,
  };
}

export function listPublicTierConfig(isPro) {
  const limits = getTierLimits(isPro);

  return {
    isPro,
    showAds: isPro ? false : limits.showAds,
    detailedAnalytics: isPro ? true : limits.detailedAnalytics,
    limits: {
      aiGenerateTestsPerDay: limits.aiGenerateTestsPerDay,
      aiDoubtsFastPerDay: limits.aiDoubtsFastPerDay,
      aiDoubtsQualityPerDay: limits.aiDoubtsQualityPerDay,
      aiEvaluationsPerDay: limits.aiEvaluationsPerDay,
      mocksPerDay: limits.mocksPerDay,
    },
    features: TIER_FEATURE_KEYS.reduce((acc, key) => {
      const feature = TIER_FEATURES[key];
      acc[key] = {
        type: feature.type,
        limit:
          feature.type === 'quota' && feature.limitKey
            ? limits[feature.limitKey]
            : null,
        ...getFeaturePaywallCopy(key),
      };
      return acc;
    }, {}),
  };
}
