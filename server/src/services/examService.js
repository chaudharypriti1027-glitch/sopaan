import { Exam } from '../models/Exam.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { publishedContentFilter } from '../models/publishableFields.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';

const EXAM_LIST_FIELDS =
  'name code category description vacancies stages importantDates createdAt updatedAt';

export async function listExams(query) {
  const { limit, offset } = parsePagination(query);
  const cacheKey = stableCacheKey('cache:exam:list', { limit, offset });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.examListSec, async () => {
    const [items, total] = await Promise.all([
      Exam.find(publishedContentFilter)
        .select(EXAM_LIST_FIELDS)
        .sort({ name: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Exam.countDocuments(publishedContentFilter),
    ]);

    return buildPaginatedResult({ items, total, limit, offset });
  });
}

export async function getExamById(id) {
  const exam = await Exam.findOne({ $and: [{ _id: id }, publishedContentFilter] }).lean();

  if (!exam) {
    throw new AppError('Exam not found', 404, 'NOT_FOUND');
  }

  return exam;
}

export async function getExamCalendar(query) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const cacheKey = stableCacheKey('cache:exam:calendar', { limit, offset });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.examCalendarSec, async () => {
    const now = new Date();

    const pipeline = [
      { $match: publishedContentFilter },
      { $unwind: '$importantDates' },
      {
        $match: {
          'importantDates.date': { $gte: now },
          'importantDates.type': { $in: ['open', 'apply', 'exam', 'result', 'admit', 'other'] },
        },
      },
      {
        $project: {
          _id: 0,
          examId: '$_id',
          examName: '$name',
          examCode: '$code',
          category: '$category',
          label: '$importantDates.label',
          date: '$importantDates.date',
          type: '$importantDates.type',
        },
      },
      { $sort: { date: 1 } },
      {
        $facet: {
          items: [{ $skip: offset }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await Exam.aggregate(pipeline);
    const items = result?.items ?? [];
    const total = result?.total?.[0]?.count ?? 0;

    return buildPaginatedResult({ items, total, limit, offset });
  });
}
