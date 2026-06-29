import { User } from '../../models/User.js';
import { AiCallLog } from '../../models/AiCallLog.js';
import { AiDailyUsage } from '../../models/AiDailyUsage.js';
import { AppError } from '../../utils/AppError.js';
import {
  assertAiTierAccess,
  utcDateKey,
} from '../quotaService.js';
import { getUsageFieldForTier } from './aiUsageLimits.js';
import { logger } from '../../observability/logger.js';
import { recordAiUsage as recordAiMetrics } from '../../observability/metrics.js';
import { recordAiCostForAlerting } from '../../observability/alerts.js';
import { incrementGlobalTokenUsage } from './aiGlobalBudget.js';

export { utcDateKey };

export async function assertWithinDailyLimit(userId, tier) {
  if (!userId) {
    return { isPremium: false };
  }

  const user = await User.findById(userId).select('isPremium premiumExpiresAt');
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const result = await assertAiTierAccess(user, tier);
  return { isPremium: result.isPro };
}

export async function recordAiUsage({
  userId,
  tier,
  feature,
  model,
  usage,
  latencyMs,
  budgetDegraded = false,
}) {
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const cacheCreationInputTokens = usage?.cache_creation_input_tokens ?? 0;
  const cacheReadInputTokens = usage?.cache_read_input_tokens ?? 0;
  const totalTokens = inputTokens + outputTokens;

  const costUsd = recordAiMetrics({
    feature,
    tier,
    inputTokens,
    outputTokens,
    cacheReadTokens: cacheReadInputTokens,
    cacheWriteTokens: cacheCreationInputTokens,
  });

  recordAiCostForAlerting(costUsd);
  await incrementGlobalTokenUsage(totalTokens);

  logger.info('ai usage recorded', {
    feature,
    tier,
    model,
    inputTokens,
    outputTokens,
    cacheWriteTokens: cacheCreationInputTokens,
    cacheReadTokens: cacheReadInputTokens,
    latencyMs,
    estimatedCostUsd: Number(costUsd.toFixed(6)),
    budgetDegraded,
    ...(userId ? { userId: String(userId) } : {}),
  });

  await AiCallLog.create({
    userId: userId ?? null,
    feature,
    tier,
    model,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    latencyMs,
  });

  if (!userId) {
    return;
  }

  const dateKey = utcDateKey();
  const field = getUsageFieldForTier(tier);

  await AiDailyUsage.findOneAndUpdate(
    { userId, dateKey },
    {
      $inc: {
        [field]: 1,
        inputTokens,
        outputTokens,
        cacheReadTokens: cacheReadInputTokens,
        cacheWriteTokens: cacheCreationInputTokens,
      },
      $setOnInsert: { userId, dateKey },
    },
    { upsert: true, new: true },
  );
}
