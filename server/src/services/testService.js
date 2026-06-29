import { Test } from '../models/Test.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { sanitizeQuestionForAttempt } from '../utils/testHelpers.js';
import { caseInsensitiveRegex } from '../utils/regex.js';

function buildTestFilters(query, user) {
  const filters = {};

  if (user.role === 'student') {
    filters.status = 'published';
  }

  if (query.type) {
    filters.type = query.type;
  }

  if (query.subject) {
    filters.subject = caseInsensitiveRegex(query.subject);
  }

  if (query.examTag) {
    filters.examTag = caseInsensitiveRegex(query.examTag);
  }

  return filters;
}

export async function listTests(query, user) {
  const { limit, offset } = parsePagination(query);
  const filters = buildTestFilters(query, user);

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
          type: 1,
          examTag: 1,
          status: 1,
          stats: 1,
          createdAt: 1,
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

export async function getTestForAttempt(testId, user) {
  const test = await Test.findOne({ _id: testId }).populate('questions').lean();

  if (!test) {
    throw new AppError('Test not found', 404, 'NOT_FOUND');
  }

  if (user.role === 'student') {
    const isOwner = test.createdBy?.toString() === user._id.toString();
    if (test.status !== 'published' && !isOwner) {
      throw new AppError('Test not found', 404, 'NOT_FOUND');
    }
  }

  const isOwner = test.createdBy?.toString() === user._id.toString();

  return {
    ...test,
    questions: (test.questions ?? []).map((question) => {
      const value = typeof question.toObject === 'function' ? question.toObject() : { ...question };
      return isOwner ? value : sanitizeQuestionForAttempt(value);
    }),
  };
}
