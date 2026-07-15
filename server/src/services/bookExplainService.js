import crypto from 'crypto';
import { aiRuntimeConfig } from '../config/aiRuntimeConfig.js';
import { env } from '../config/env.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import { recordAiUsage } from './ai/aiUsageService.js';
import { stubBookExplain } from './ai/e2eStubs.js';
import { getBookById } from './libraryService.js';
import { client, resolveModel } from './ai/claudeClient.js';
import { mapAnthropicError } from './ai/anthropicErrorMapper.js';
import { logger } from '../observability/logger.js';
import { AppError } from '../utils/AppError.js';

const EXPLAIN_SYSTEM_PROMPT =
  "Explain this passage simply for an exam aspirant preparing for any exam worldwide. Use plain English, a short everyday analogy if helpful, and end with one 'Remember this' line. Do not add new facts beyond the passage. Use plain text without emoji or decorative Unicode symbols.";

const EXPLAIN_CACHE_TTL_SEC = 30 * 24 * 60 * 60;
const EXPLAIN_MAX_TOKENS = 600;
const EXPLAIN_FALLBACK_MESSAGE = 'AI is busy right now — try again in a moment.';

export const EXPLAIN_TEXT_MAX_CHARS = 1200;

function normalizePassage(text) {
  return text.trim().replace(/\s+/g, ' ').slice(0, EXPLAIN_TEXT_MAX_CHARS);
}

export function buildExplainCacheKey(bookId, text) {
  const normalized = normalizePassage(text);
  const hash = crypto.createHash('sha1').update(normalized).digest('hex');
  return `explain:${bookId}:${hash}`;
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function startSse(res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamCachedExplanation(res, explanation, cached = true) {
  startSse(res);

  const chunks = explanation.match(/.{1,28}/gs) ?? [explanation];
  for (const chunk of chunks) {
    writeSse(res, { type: 'delta', text: chunk });
    await sleep(10);
  }

  writeSse(res, { type: 'done', ok: true, cached });
  res.end();
}

async function streamLiveExplanation({ res, passage, userId, bookId }) {
  startSse(res);

  if (aiRuntimeConfig.stubResponses) {
    const explanation = stubBookExplain(passage);
    await cacheSet(buildExplainCacheKey(bookId, passage), { explanation }, EXPLAIN_CACHE_TTL_SEC);
    const chunks = explanation.match(/.{1,28}/gs) ?? [explanation];
    for (const chunk of chunks) {
      writeSse(res, { type: 'delta', text: chunk });
      await sleep(8);
    }
    writeSse(res, { type: 'done', ok: true, cached: false });
    res.end();
    return;
  }

  const startedAt = Date.now();
  let fullText = '';

  try {
    if (!env.anthropicApiKey) {
      throw new AppError(
        'AI is temporarily unavailable because its provider is not configured.',
        503,
        'AI_UNAVAILABLE'
      );
    }

    const model = resolveModel({ tier: 'fast' });
    const stream = client.messages.stream(
      {
        model,
        max_tokens: EXPLAIN_MAX_TOKENS,
        temperature: 0.3,
        system: EXPLAIN_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: passage }],
      },
      { signal: AbortSignal.timeout(75_000) }
    );

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const delta = event.delta.text ?? '';
        if (!delta) {
          continue;
        }
        fullText += delta;
        writeSse(res, { type: 'delta', text: delta });
      }
    }

    const finalMessage = await stream.finalMessage();
    const latencyMs = Date.now() - startedAt;

    await recordAiUsage({
      userId,
      tier: 'fast',
      feature: 'book_explain',
      model,
      usage: finalMessage.usage,
      latencyMs,
    });

    const explanation = fullText.trim();
    if (explanation) {
      await cacheSet(buildExplainCacheKey(bookId, passage), { explanation }, EXPLAIN_CACHE_TTL_SEC);
    }

    writeSse(res, { type: 'done', ok: true, cached: false });
    res.end();
  } catch (err) {
    const mapped = mapAnthropicError(err);
    logger.warn('[bookExplain] streaming failed', {
      bookId,
      userId,
      code: mapped.code,
      message: mapped.message,
    });

    if (!res.headersSent) {
      res.status(200).json({ ok: false, message: EXPLAIN_FALLBACK_MESSAGE });
      return;
    }

    writeSse(res, {
      type: 'error',
      ok: false,
      code: mapped.code,
      message: EXPLAIN_FALLBACK_MESSAGE,
    });
    res.end();
  }
}

export async function explainBookPassage(bookId, body, user, res) {
  await getBookById(bookId, user);

  const passage = normalizePassage(body.text);
  if (!passage) {
    res.status(400).json({
      error: { message: 'Passage text is required', code: 'VALIDATION_ERROR' },
    });
    return;
  }

  const cacheKey = buildExplainCacheKey(bookId, passage);
  const cached = await cacheGet(cacheKey);

  if (cached?.explanation) {
    await streamCachedExplanation(res, cached.explanation, true);
    return;
  }

  await streamLiveExplanation({
    res,
    passage,
    userId: user._id?.toString(),
    bookId,
  });
}
