import { Course } from '../models/Course.js';
import { Exam } from '../models/Exam.js';
import { Test } from '../models/Test.js';
import { publishedContentFilter } from '../models/publishableFields.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapExam(exam) {
  return {
    id: exam._id.toString(),
    group: 'exams',
    title: exam.name,
    subtitle: exam.category ?? exam.code ?? '',
    route: 'ExamDetail',
    routeParams: { examId: exam._id.toString() },
  };
}

function mapCourse(course) {
  return {
    id: course._id.toString(),
    group: 'courses',
    title: course.title,
    subtitle: course.subject ?? '',
    route: 'CourseDetail',
    routeParams: { courseId: course._id.toString() },
  };
}

function mapTest(test) {
  return {
    id: test._id.toString(),
    group: 'tests',
    title: test.title,
    subtitle: [test.subject, test.difficulty, test.examTag].filter(Boolean).join(' · '),
    route: 'Quiz',
    routeParams: { testId: test._id.toString() },
  };
}

async function searchCollection(Model, { textFields, extraFilter = {}, sort, limit, mapFn }, query) {
  const trimmed = query.trim();
  const baseFilter = Object.keys(extraFilter).length ? { $and: [extraFilter] } : {};

  try {
    const textMatches = await Model.find({
      ...baseFilter,
      $text: { $search: trimmed },
    })
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    if (textMatches.length > 0) {
      return textMatches.map(mapFn);
    }
  } catch {
    // Fall back to regex when text index is unavailable.
  }

  const regex = new RegExp(escapeRegex(trimmed), 'i');
  const orClause = textFields.map((field) => ({ [field]: regex }));

  const regexMatches = await Model.find({
    ...baseFilter,
    $or: orClause,
  })
    .sort(sort)
    .limit(limit)
    .lean();

  return regexMatches.map(mapFn);
}

async function searchAllUncached(query, { limit = 8 } = {}) {
  const trimmed = query?.trim() ?? '';
  if (trimmed.length < 2) {
    return { query: trimmed, results: { exams: [], courses: [], tests: [] } };
  }

  const [exams, courses, tests] = await Promise.all([
    searchCollection(
      Exam,
      {
        textFields: ['name', 'code', 'category'],
        extraFilter: {},
        sort: { name: 1 },
        limit,
        mapFn: mapExam,
      },
      trimmed,
    ),
    searchCollection(
      Course,
      {
        textFields: ['title', 'subject'],
        extraFilter: publishedContentFilter,
        sort: { updatedAt: -1 },
        limit,
        mapFn: mapCourse,
      },
      trimmed,
    ),
    searchCollection(
      Test,
      {
        textFields: ['title', 'subject', 'examTag', 'topic'],
        extraFilter: publishedContentFilter,
        sort: { updatedAt: -1 },
        limit,
        mapFn: mapTest,
      },
      trimmed,
    ),
  ]);

  return {
    query: trimmed,
    results: {
      exams,
      courses,
      tests,
    },
  };
}

export async function searchAll(query, { limit = 8 } = {}) {
  const trimmed = query?.trim() ?? '';
  if (trimmed.length < 2) {
    return { query: trimmed, results: { exams: [], courses: [], tests: [] } };
  }

  const cacheKey = stableCacheKey('cache:search', {
    q: trimmed.toLowerCase(),
    limit,
  });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.searchSec, () => searchAllUncached(trimmed, { limit }));
}
