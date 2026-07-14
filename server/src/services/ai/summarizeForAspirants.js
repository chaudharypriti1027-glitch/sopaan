import { z } from 'zod';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { complete } from './claudeClient.js';
import { stubCurrentAffairSummary } from './e2eStubs.js';
import { CA_SUMMARIZATION_RUBRIC } from './prompts/currentAffairsPrompts.js';
import { validateQuestionBatch } from './outputValidation.js';

const MAX_SUMMARY_CHARS = 900;
const MAX_ATTEMPTS = 2;

const summaryShapeSchema = z.object({
  summary: z.string().trim().min(20).max(MAX_SUMMARY_CHARS),
  shortAnswer: z.string().trim().min(10).max(220),
  examTip: z.string().trim().min(10).max(200),
  keyPoints: z.array(z.string().trim().min(5).max(120)).min(3).max(5),
  category: z.string().trim().min(1),
  quizQuestions: z.array(z.unknown()).length(3),
});

function buildUserPrompt({ title, snippet, sourceName, sourceUrl, publishedAt, language }) {
  return `Summarize this current-affairs item for exam aspirants.

Source: ${sourceName}
Published: ${publishedAt ?? 'unknown'}
Official link (for attribution only, do not scrape): ${sourceUrl ?? 'n/a'}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

Headline:
${title}

Syndicated snippet (metadata only — write an original summary):
${snippet || '(no snippet provided)'}

Return ONLY the JSON object described in the system rubric with exactly 3 quiz questions.`;
}

export function validateSummarizeForAspirantsResponse(raw) {
  const parsed = summaryShapeSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((issue) => issue.message).join(', '));
  }

  const quizQuestions = validateQuestionBatch(parsed.data.quizQuestions, 3);

  return {
    summary: parsed.data.summary.trim(),
    shortAnswer: parsed.data.shortAnswer.trim(),
    examTip: parsed.data.examTip.trim(),
    keyPoints: parsed.data.keyPoints.map((point) => point.trim()),
    category: parsed.data.category.trim(),
    quizQuestions,
  };
}

/**
 * Turn syndicated feed metadata into an original aspirant summary + 3 quiz questions.
 */
export async function summarizeForAspirants({
  title,
  snippet,
  sourceName,
  sourceUrl,
  publishedAt,
  language = 'en',
}) {
  if (aiRuntimeConfig.stubResponses) {
    return validateSummarizeForAspirantsResponse(stubCurrentAffairSummary(title));
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const raw = await complete({
        stableSystem: CA_SUMMARIZATION_RUBRIC,
        user: buildUserPrompt({ title, snippet, sourceName, sourceUrl, publishedAt, language }),
        tier: 'fast',
        feature: 'current_affairs_summary',
        maxTokens: 2500,
        json: true,
        timeoutMs: 60_000,
      });

      return validateSummarizeForAspirantsResponse(raw);
    } catch (err) {
      lastError = err;
      console.warn(
        `[summarizeForAspirants] validation failed (attempt ${attempt}): ${err.message}`,
      );
    }
  }

  throw lastError ?? new Error('summarizeForAspirants failed');
}
