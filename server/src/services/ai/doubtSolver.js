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

const MIN_ANSWER_CHARS = 18;

function buildConciseSuffix() {
  return 'Reply in the shortest form that fully answers the question. Skip Explanation and Exam tip sections when they add no value.';
}

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

function buildExamSuffix(targetExam) {
  const exam = targetExam?.trim();
  if (!exam) {
    return '';
  }

  return `The student is preparing for ${exam}. Tailor depth, terminology, and examples to this exam.`;
}

function buildUserPrompt({ question, imageBase64 }) {
  if (imageBase64) {
    return question.trim()
      ? `Solve the exam question shown in the image. Additional context from the student: ${question}`
      : 'Solve the exam question shown in the image.';
  }

  return question;
}

function isWeakAnswer(text) {
  const trimmed = text.trim();
  if (/^answer\s*:/i.test(trimmed) && trimmed.length >= MIN_ANSWER_CHARS) {
    return false;
  }

  if (trimmed.length < MIN_ANSWER_CHARS) {
    return true;
  }

  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("i can't") ||
    lower.startsWith('i cannot') ||
    lower.includes('as an ai') ||
    lower === 'n/a'
  );
}

async function generateFreshExplanation({
  prompt,
  imageBase64,
  language,
  userId,
  targetExam,
  skipCache,
  imageAttached,
}) {
  const useQualityModel = Boolean(skipCache || imageAttached);
  const dynamicSuffix = [
    respondInLanguageSuffix(language),
    buildExamSuffix(targetExam),
    buildConciseSuffix(),
  ]
    .filter(Boolean)
    .join('\n');

  const content = imageBase64
    ? buildMessageContent({ text: prompt, imageBase64 })
    : undefined;

  const explanation = await complete({
    stableSystem: DOUBT_SOLVER_RUBRIC,
    dynamicSystemSuffix: dynamicSuffix,
    user: prompt,
    content,
    tier: useQualityModel ? 'quality' : 'fast',
    feature: 'doubt_solver',
    userId,
    maxTokens: imageAttached ? 1400 : 900,
    timeoutMs: 75_000,
  });

  let trimmed = explanation.trim();

  if (isWeakAnswer(trimmed)) {
    const retry = await complete({
      stableSystem: DOUBT_SOLVER_RUBRIC,
      dynamicSystemSuffix: `${dynamicSuffix}\nYour previous reply was incomplete. Give a direct Answer: line first, then at most 3 short explanation bullets. Stay under 180 words.`,
      user: `${prompt}\n\nProvide a complete but concise exam-style solution.`,
      content,
      tier: 'quality',
      feature: 'doubt_solver',
      userId,
      maxTokens: 1100,
      timeoutMs: 75_000,
    });
    trimmed = retry.trim();
  }

  return trimmed;
}

export async function solveDoubt({
  question,
  imageBase64,
  language = 'en',
  userId,
  skipCache = false,
  targetExam,
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
      cacheSource: payload.cacheSource ?? null,
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

  const prompt = buildUserPrompt({ question, imageBase64 });

  try {
    const trimmed = await generateFreshExplanation({
      prompt,
      imageBase64,
      language,
      userId,
      targetExam,
      skipCache,
      imageAttached,
    });

    if (!trimmed) {
      throw new AppError('AI returned an empty answer', 502, 'AI_GENERATION_FAILED');
    }

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
