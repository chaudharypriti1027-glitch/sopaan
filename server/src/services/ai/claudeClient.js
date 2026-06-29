import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { assertWithinDailyLimit, recordAiUsage } from './aiUsageService.js';
import { sanitizeAiUserText } from './piiMinimizer.js';
import { mapAnthropicError } from './anthropicErrorMapper.js';
import { isGlobalBudgetExceeded } from './aiGlobalBudget.js';
import { FEATURE_MODEL_TIER, resolveEffectiveTier } from './aiModelRouting.js';
import { logger } from '../../observability/logger.js';

export { FEATURE_MODEL_TIER };

export const TIERS = Object.freeze({
  FAST: 'fast',
  QUALITY: 'quality',
});

export const MODELS = Object.freeze({
  FAST: 'claude-haiku-4-5-20251001',
  QUALITY: 'claude-sonnet-4-6',
  /** @deprecated Use MODELS.QUALITY or tier: 'quality' */
  SONNET: 'claude-sonnet-4-6',
  /** @deprecated Use MODELS.FAST or tier: 'fast' */
  HAIKU: 'claude-haiku-4-5-20251001',
});

const DEFAULT_TIER = TIERS.QUALITY;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

const client = new Anthropic({
  apiKey: env.anthropicApiKey,
});

export function resolveModel({ tier, model }) {
  if (model) {
    return model;
  }

  if (tier === TIERS.FAST) {
    return env.anthropicFastModel || MODELS.FAST;
  }

  if (tier === TIERS.QUALITY) {
    return env.anthropicModel || MODELS.QUALITY;
  }

  return env.anthropicModel || MODELS.QUALITY;
}

/**
 * Build a system prompt with prompt caching on stable content.
 * Sonnet 4.6 caches blocks ≥1,024 tokens; Haiku 4.5 ≥4,096 tokens.
 */
export function buildCachedSystem({ stableText, dynamicSuffix, cache = true }) {
  const blocks = [];

  if (stableText) {
    blocks.push({
      type: 'text',
      text: stableText,
      ...(cache ? { cache_control: { type: 'ephemeral' } } : {}),
    });
  }

  if (dynamicSuffix) {
    blocks.push({ type: 'text', text: dynamicSuffix });
  }

  if (blocks.length === 0) {
    return undefined;
  }

  if (blocks.length === 1 && !cache) {
    return blocks[0].text;
  }

  return blocks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
  return err?.status === 429 || err?.error?.type === 'rate_limit_error';
}

function stripJsonFences(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }

  return cleaned.trim();
}

function parseJsonResponse(text) {
  const cleaned = stripJsonFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse Claude JSON response: ${err.message}. Raw text: ${cleaned.slice(0, 200)}`,
    );
  }
}

function extractText(response) {
  const block = response.content?.[0];

  if (!block || block.type !== 'text') {
    throw new Error('Claude response did not contain a text content block');
  }

  return block.text;
}

function parseImageBase64(imageBase64) {
  let mediaType = 'image/jpeg';
  let data = imageBase64.trim();

  const match = data.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);

  if (match) {
    mediaType = match[1];
    data = match[2];
  }

  return { mediaType, data };
}

export function buildMessageContent({ text, imageBase64 }) {
  const blocks = [];

  if (imageBase64) {
    const image = parseImageBase64(imageBase64);
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mediaType,
        data: image.data,
      },
    });
  }

  blocks.push({ type: 'text', text });
  return blocks;
}

function resolveSystemParam({ system, stableSystem, dynamicSystemSuffix, cacheSystem }) {
  if (stableSystem) {
    return buildCachedSystem({
      stableText: stableSystem,
      dynamicSuffix: dynamicSystemSuffix,
      cache: cacheSystem,
    });
  }

  if (system && cacheSystem) {
    return buildCachedSystem({ stableText: system, cache: true });
  }

  return system;
}

async function createMessageWithRetry(params, timeoutMs) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await client.messages.create(params, {
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      lastError = err;

      if (isRateLimitError(err) && attempt < MAX_RETRIES) {
        const delay = BASE_BACKOFF_MS * 2 ** attempt;
        await sleep(delay);
        continue;
      }

      throw mapAnthropicError(err);
    }
  }

  throw mapAnthropicError(lastError);
}

/**
 * Send a completion request to Claude.
 *
 * @param {object} options
 * @param {'fast'|'quality'} [options.tier] - Model tier (routes to Haiku or Sonnet)
 * @param {string} [options.model] - Explicit model override
 * @param {string} [options.feature] - Feature name for usage logging
 * @param {string} [options.userId] - User id for daily limits and logging
 * @param {string} [options.system] - Full system prompt (cached when cacheSystem is true)
 * @param {string} [options.stableSystem] - Stable cached system block
 * @param {string} [options.dynamicSystemSuffix] - Non-cached system suffix
 * @param {boolean} [options.cacheSystem=true] - Enable prompt caching on stable system content
 * @param {string} options.user - User message text (ignored if content is set)
 * @param {Array} [options.content] - Multimodal user content blocks
 * @param {number} [options.maxTokens] - Max output tokens
 * @param {boolean} [options.json] - Parse response as JSON
 * @param {number} [options.timeoutMs] - Request timeout in milliseconds
 * @returns {Promise<string|object>} Text or parsed JSON
 */
export async function complete({
  system,
  stableSystem,
  dynamicSystemSuffix,
  cacheSystem = true,
  user,
  content,
  tier,
  model,
  feature = 'unknown',
  userId,
  maxTokens = DEFAULT_MAX_TOKENS,
  json = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const budgetExceeded = await isGlobalBudgetExceeded();
  const effectiveTier = resolveEffectiveTier({ tier, feature, budgetExceeded });
  const resolvedModel = resolveModel({ tier: effectiveTier, model });
  const resolvedSystem = resolveSystemParam({
    system,
    stableSystem,
    dynamicSystemSuffix,
    cacheSystem,
  });

  if (budgetExceeded && effectiveTier !== tier) {
    logger.warn('ai global budget active — downgraded model tier', {
      feature,
      requestedTier: tier ?? FEATURE_MODEL_TIER[feature] ?? DEFAULT_TIER,
      effectiveTier,
      model: resolvedModel,
    });
  }

  const sanitizedUser = user ? sanitizeAiUserText(user) : user;
  const sanitizedContent = content
    ? content.map((block) =>
        block?.type === 'text' && typeof block.text === 'string'
          ? { ...block, text: sanitizeAiUserText(block.text) }
          : block,
      )
    : content;

  if (userId) {
    await assertWithinDailyLimit(userId, effectiveTier);
  }

  const startedAt = Date.now();

  const response = await createMessageWithRetry(
    {
      model: resolvedModel,
      max_tokens: maxTokens,
      system: typeof resolvedSystem === 'string' ? sanitizeAiUserText(resolvedSystem) : resolvedSystem,
      messages: [{ role: 'user', content: sanitizedContent ?? sanitizedUser }],
    },
    timeoutMs,
  );

  const latencyMs = Date.now() - startedAt;

  await recordAiUsage({
    userId,
    tier: effectiveTier,
    feature,
    model: resolvedModel,
    usage: response.usage,
    latencyMs,
    budgetDegraded: budgetExceeded && effectiveTier !== tier,
  });

  const text = extractText(response);

  if (json) {
    return parseJsonResponse(text);
  }

  return text;
}

export { client };
