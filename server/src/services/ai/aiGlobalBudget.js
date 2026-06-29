import { getAiGlobalBudgetConfig } from '../../config/aiBudgetConfig.js';
import { isRedisReady, getRedisClient } from '../../lib/redis.js';
import { utcDateKey } from '../quotaService.js';
import { logger } from '../../observability/logger.js';
import { alertGlobalAiBudgetExceeded } from '../../observability/alerts.js';

let memoryState = { dateKey: '', tokens: 0, alertFired: false };

function redisKey(dateKey) {
  return `ai:global:tokens:${dateKey}`;
}

function rollMemoryDate() {
  const dateKey = utcDateKey();
  if (memoryState.dateKey !== dateKey) {
    memoryState = { dateKey, tokens: 0, alertFired: false };
  }
}

async function getCurrentUsage() {
  const dateKey = utcDateKey();

  if (isRedisReady()) {
    const value = await getRedisClient().get(redisKey(dateKey));
    return Number(value ?? 0);
  }

  rollMemoryDate();
  return memoryState.tokens;
}

export async function isGlobalBudgetExceeded() {
  const { enabled, globalDailyTokenBudget } = getAiGlobalBudgetConfig();
  if (!enabled) {
    return false;
  }

  const usage = await getCurrentUsage();
  return usage >= globalDailyTokenBudget;
}

export async function getGlobalDailyTokenUsage() {
  return getCurrentUsage();
}

export async function incrementGlobalTokenUsage(tokens) {
  const { enabled, globalDailyTokenBudget } = getAiGlobalBudgetConfig();
  if (!tokens || tokens <= 0 || !enabled) {
    return;
  }

  const dateKey = utcDateKey();
  const budget = globalDailyTokenBudget;
  let newTotal;

  if (isRedisReady()) {
    const key = redisKey(dateKey);
    newTotal = await getRedisClient().incrby(key, tokens);
    await getRedisClient().expire(key, 48 * 60 * 60);
  } else {
    rollMemoryDate();
    memoryState.tokens += tokens;
    newTotal = memoryState.tokens;
  }

  const wasUnder = newTotal - tokens < budget;
  if (wasUnder && newTotal >= budget) {
    await fireGlobalBudgetAlert({ dateKey, tokensUsed: newTotal, budget });
  }
}

async function fireGlobalBudgetAlert(payload) {
  if (isRedisReady()) {
    const alertKey = `ai:global:budget-alert:${payload.dateKey}`;
    const claimed = await getRedisClient().set(alertKey, '1', 'EX', 48 * 60 * 60, 'NX');
    if (claimed !== 'OK') {
      return;
    }
  } else {
    rollMemoryDate();
    if (memoryState.alertFired) {
      return;
    }
    memoryState.alertFired = true;
  }

  logger.warn('AI global daily token budget exceeded — degrading quality-tier calls to Haiku', payload);
  await alertGlobalAiBudgetExceeded(payload);
}

export function resetGlobalBudgetForTests() {
  memoryState = { dateKey: '', tokens: 0, alertFired: false };
}
