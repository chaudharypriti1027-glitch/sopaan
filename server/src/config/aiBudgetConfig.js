/** Global daily token budget — circuit-breaker degrades quality-tier calls to Haiku when exceeded. */
export function getAiGlobalBudgetConfig() {
  const raw = process.env.AI_GLOBAL_DAILY_TOKEN_BUDGET;

  return Object.freeze({
    globalDailyTokenBudget: Number(raw ?? 2_000_000),
    enabled: raw !== '0',
  });
}
