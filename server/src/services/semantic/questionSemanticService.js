import { env } from '../../config/env.js';
import { Question } from '../../models/Question.js';
import { AppError } from '../../utils/AppError.js';
import { embedDocument, embedQuery, getEmbeddingProvider } from '../embeddings/index.js';
import { vectorSearch } from '../embeddings/vectorSearchService.js';
import { ingestQuestion } from '../questions/questionIngestService.js';

export function buildQuestionSearchText(question) {
  const options = question.options?.map((option) => `${option.key}. ${option.text}`).join('\n') ?? '';
  return `${question.text}\n${options}`.trim();
}

export async function ensureQuestionEmbedding(questionDoc) {
  if (questionDoc.embedding?.length) {
    return questionDoc;
  }

  const searchText = buildQuestionSearchText(questionDoc);
  const provider = getEmbeddingProvider();
  const embedding = await embedDocument(searchText);

  questionDoc.embedding = embedding;
  questionDoc.embeddingModel = provider.model;
  await questionDoc.save();

  return questionDoc;
}

export async function findSimilarQuestions({
  text,
  options,
  subject,
  language,
  excludeId,
  limit = 5,
  minScore = env.questionSimilarityThreshold,
}) {
  const searchText = options?.length ? buildQuestionSearchText({ text, options }) : text.trim();

  if (!searchText) {
    return [];
  }

  const queryVector = await embedQuery(searchText);
  const filter = {};

  if (subject) {
    filter.subject = subject;
  }

  if (language) {
    filter.language = language;
  }

  const matches = await vectorSearch({
    model: Question,
    indexName: env.vectorSearchIndexes.questions,
    queryVector,
    filter,
    limit: excludeId ? limit + 1 : limit,
    minScore,
  });

  return matches
    .filter((doc) => !excludeId || doc._id.toString() !== excludeId.toString())
    .slice(0, limit);
}

export async function insertQuestionsWithDedup(validatedQuestions, meta) {
  const inserted = [];
  let duplicateCount = 0;

  for (const item of validatedQuestions) {
    const doc = await ingestQuestion(
      meta.userId,
      {
        ...item,
        subject: meta.subject,
        examTags: [meta.examTag],
        language: meta.language,
      },
      { source: 'ai' },
    );

    if (doc.duplicateOf) {
      duplicateCount += 1;
    }

    inserted.push(doc);
  }

  return { questions: inserted, duplicateCount, reusedCount: duplicateCount };
}

export async function getQuestionById(questionId) {
  const question = await Question.findById(questionId).lean();

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  return question;
}

export async function getRelatedQuestions(questionId, { limit = 5 } = {}) {
  const question = await Question.findById(questionId);

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  await ensureQuestionEmbedding(question);

  const related = await findSimilarQuestions({
    text: buildQuestionSearchText(question),
    subject: question.subject,
    language: question.language,
    excludeId: question._id,
    limit,
    minScore: Math.max(0.75, env.questionSimilarityThreshold - 0.1),
  });

  return related.map((doc) => ({
    id: doc._id.toString(),
    text: doc.text,
    subject: doc.subject,
    topic: doc.topic,
    difficulty: doc.difficulty,
    score: doc.score,
  }));
}

export function formatQuestionPreview(question) {
  return {
    id: question._id?.toString?.() ?? question.id,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    text: question.text,
    options: question.options,
    correctKey: question.correctKey,
    explanation: question.explanation,
    language: question.language,
    source: question.source,
  };
}
