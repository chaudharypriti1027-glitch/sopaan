import { AiDoubtAnswer } from '../../models/AiDoubtAnswer.js';
import { parsePagination, buildPaginatedResult } from '../../utils/pagination.js';

export async function saveDoubtAnswer({
  userId,
  question,
  explanation,
  language = 'en',
  imageAttached = false,
  fromCache = false,
  cacheSource = null,
  responseMs,
}) {
  const normalizedQuestion = question?.trim();
  const normalizedExplanation = explanation?.trim();

  if (!userId || !normalizedQuestion || !normalizedExplanation) {
    return null;
  }

  const doc = await AiDoubtAnswer.findOneAndUpdate(
    { userId, question: normalizedQuestion, language },
    {
      $set: {
        explanation: normalizedExplanation,
        imageAttached,
        fromCache,
        cacheSource,
        responseMs,
      },
      $setOnInsert: {
        userId,
        question: normalizedQuestion,
        language,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    id: doc._id.toString(),
    question: doc.question,
    explanation: doc.explanation,
    language: doc.language,
    imageAttached: doc.imageAttached,
    fromCache: doc.fromCache,
    cacheSource: doc.cacheSource,
    responseMs: doc.responseMs,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function findUserExactDoubtAnswer(userId, question, language = 'en') {
  const normalized = question?.trim();
  if (!userId || !normalized) {
    return null;
  }

  const doc = await AiDoubtAnswer.findOne({ userId, question: normalized, language })
    .sort({ createdAt: -1 })
    .lean();

  if (!doc) {
    return null;
  }

  return {
    id: doc._id.toString(),
    explanation: doc.explanation,
    fromCache: true,
    cacheSource: 'user_history',
  };
}

export async function listDoubtAnswers(userId, query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 30, maxLimit: 100 });

  const [items, total] = await Promise.all([
    AiDoubtAnswer.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    AiDoubtAnswer.countDocuments({ userId }),
  ]);

  return buildPaginatedResult({
    items: items.map((doc) => ({
      id: doc._id.toString(),
      question: doc.question,
      explanation: doc.explanation,
      language: doc.language,
      imageAttached: doc.imageAttached,
      fromCache: doc.fromCache,
      cacheSource: doc.cacheSource,
      responseMs: doc.responseMs,
      createdAt: doc.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
