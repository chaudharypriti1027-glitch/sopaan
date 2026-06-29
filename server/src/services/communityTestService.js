import { Test } from '../models/Test.js';
import { Question } from '../models/Question.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { ingestQuestion } from './questions/questionIngestService.js';

async function resolveQuestionIds(userId, data) {
  if (data.questionIds?.length) {
    const questions = await Question.find({ _id: { $in: data.questionIds } });

    if (questions.length !== data.questionIds.length) {
      throw new AppError('One or more questionIds are invalid', 400, 'VALIDATION_ERROR');
    }

    return data.questionIds;
  }

  if (!data.questions?.length) {
    throw new AppError('At least one question is required', 400, 'VALIDATION_ERROR');
  }

  const created = [];

  for (const question of data.questions) {
    created.push(
      await ingestQuestion(
        userId,
        {
          ...question,
          examTags: [data.examTag],
          language: question.language ?? 'en',
        },
        { source: 'community' },
      ),
    );
  }

  return created.map((question) => question._id);
}

export async function createCommunityTest(userId, data) {
  const questionIds = await resolveQuestionIds(userId, data);
  const status = data.status === 'published' ? 'published' : 'draft';

  return Test.create({
    title: data.title,
    subject: data.subject,
    topic: data.topic,
    difficulty: data.difficulty,
    durationSec: data.durationSec,
    examTag: data.examTag,
    type: 'community',
    status,
    createdBy: userId,
    questions: questionIds,
  });
}

export async function listCommunityTests(query, userId) {
  const { limit, offset } = parsePagination(query);
  const filters = { type: 'community' };

  if (query.mine && userId) {
    filters.createdBy = userId;
  } else if (query.published === true) {
    filters.status = 'published';
  } else if (query.published === false) {
    filters.status = { $ne: 'published' };
  }

  const [items, total] = await Promise.all([
    Test.aggregate([
      { $match: filters },
      {
        $project: {
          title: 1,
          subject: 1,
          topic: 1,
          difficulty: 1,
          durationSec: 1,
          examTag: 1,
          status: 1,
          stats: 1,
          createdAt: 1,
          createdBy: 1,
          questionCount: { $size: '$questions' },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]),
    Test.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}
