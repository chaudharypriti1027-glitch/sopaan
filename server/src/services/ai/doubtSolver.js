import { AppError } from '../../utils/AppError.js';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { respondInLanguageSuffix } from '../../utils/languageLabel.js';
import { AiDoubtCache } from '../../models/AiDoubtCache.js';
import { complete, buildMessageContent } from './claudeClient.js';
import { stubDoubtAnswer } from './e2eStubs.js';
import { DOUBT_SOLVER_RUBRIC } from './prompts/stablePrompts.js';
import {
  findUserExactDoubtAnswer,
  saveDoubtAnswer,
} from './aiDoubtHistoryService.js';
import {
  cacheAiDoubtAnswer,
  findSimilarAnsweredDoubts,
  recordAiDoubtCacheHit,
} from '../semantic/doubtSemanticService.js';

async function findExactCacheMatch(normalizedQuestion, language) {
  const doc = await AiDoubtCache.findOne({ queryText: normalizedQuestion, language })
    .select('explanation')
    .lean();

  if (!doc?.explanation) {
    return null;
  }

  return {
    explanation: doc.explanation.trim(),
    fromCache: true,
    cacheSource: 'exact_cache',
  };
}

function scheduleSemanticCache({ queryText, explanation, language, userId }) {
  void cacheAiDoubtAnswer({ queryText, explanation, language, userId }).catch((err) => {
    console.warn(`[doubtSolver] Failed to cache AI answer: ${err.message}`);
  });
}

export async function solveDoubt({
  question,
  imageBase64,
  language = 'en',
  userId,
  skipCache = false,
}) {
  const startedAt = Date.now();
  const normalizedQuestion = question.trim();
  const imageAttached = Boolean(imageBase64);

  const finish = async (payload) => {
    const responseMs = Date.now() - startedAt;
    const saved = await saveDoubtAnswer({
      userId,
      question: normalizedQuestion || question,
      explanation: payload.explanation,
      language,
      imageAttached,
      fromCache: payload.fromCache ?? false,
      cacheSource: payload.cacheSource ?? null,
      responseMs,
    }).catch((err) => {
      console.warn(`[doubtSolver] Failed to save doubt history: ${err.message}`);
      return null;
    });

    return {
      explanation: payload.explanation,
      fromCache: payload.fromCache ?? false,
      suggestedMatch: payload.suggestedMatch,
      answerId: saved?.id,
      responseMs,
    };
  };

  if (aiRuntimeConfig.stubResponses) {
    const stub = stubDoubtAnswer(normalizedQuestion || question, { imageScan: imageAttached });
    return finish({
      explanation: stub.explanation,
      fromCache: false,
    });
  }

  if (!skipCache && normalizedQuestion) {
    const userMatch = userId
      ? await findUserExactDoubtAnswer(userId, normalizedQuestion, language)
      : null;

    if (userMatch) {
      return finish({
        explanation: userMatch.explanation,
        fromCache: true,
        cacheSource: 'user_history',
      });
    }

    if (!imageAttached) {
      const exact = await findExactCacheMatch(normalizedQuestion, language);
      if (exact) {
        return finish(exact);
      }

      const matches = await findSimilarAnsweredDoubts(normalizedQuestion, { language, limit: 1 });
      if (matches.length > 0) {
        const match = matches[0];

        if (match.source === 'ai_cache') {
          await recordAiDoubtCacheHit(match.id);
        }

        return finish({
          explanation: match.explanation,
          fromCache: true,
          cacheSource: match.source,
          suggestedMatch: {
            id: match.id,
            source: match.source,
            score: match.score,
            queryText: match.queryText,
            title: match.title,
          },
        });
      }
    }
  }

  const prompt = imageBase64
    ? `The student scanned a printed exam question. Read the question from the image and any text below, then solve it.\n\nAdditional context: ${question}`
    : question;

  try {
    const explanation = await complete({
      stableSystem: DOUBT_SOLVER_RUBRIC,
      dynamicSystemSuffix: respondInLanguageSuffix(language),
      user: prompt,
      content: buildMessageContent({ text: prompt, imageBase64 }),
      tier: 'fast',
      feature: 'doubt_solver',
      userId,
      maxTokens: 1200,
      timeoutMs: 60_000,
    });

    const trimmed = explanation.trim();

    if (!imageAttached && normalizedQuestion && trimmed) {
      scheduleSemanticCache({
        queryText: normalizedQuestion,
        explanation: trimmed,
        language,
        userId,
      });
    }

    return finish({
      explanation: trimmed,
      fromCache: false,
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError(`Doubt solving failed: ${err.message}`, 502, 'AI_GENERATION_FAILED');
  }
}
