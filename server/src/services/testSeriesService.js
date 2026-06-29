import { TestSeries } from '../models/TestSeries.js';
import { Test } from '../models/Test.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';

function resolveMockState(mock, now = new Date()) {
  const unlockDate = new Date(mock.unlockDate);

  if (unlockDate > now) {
    return 'locked';
  }

  if (mock.isLive) {
    return 'live';
  }

  return 'available';
}

function formatSeries(series, userId, testsById) {
  const enrolled = userId
    ? series.enrolledUsers.some((id) => id.toString() === userId.toString())
    : false;

  const mocks = (series.mocks ?? []).map((mock, index) => {
    const test = testsById.get(mock.testId.toString());
    const state = resolveMockState(mock);

    return {
      index: index + 1,
      testId: mock.testId,
      title: test?.title ?? `Mock ${index + 1}`,
      subject: test?.subject,
      durationSec: test?.durationSec,
      unlockDate: mock.unlockDate,
      isLive: mock.isLive,
      state,
    };
  });

  return {
    id: series._id,
    title: series.title,
    examTag: series.examTag,
    enrolled,
    mockCount: mocks.length,
    mocks,
    createdAt: series.createdAt,
  };
}

export async function listTestSeries(query, userId) {
  const { limit, offset } = parsePagination(query);
  const filters = query.examTag ? { examTag: query.examTag } : {};

  const [seriesList, total] = await Promise.all([
    TestSeries.find(filters).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    TestSeries.countDocuments(filters),
  ]);

  const testIds = [
    ...new Set(
      seriesList.flatMap((series) => (series.mocks ?? []).map((mock) => mock.testId.toString()))
    ),
  ];
  const tests = await Test.find({ _id: { $in: testIds } })
    .select('title subject durationSec')
    .lean();
  const testsById = new Map(tests.map((test) => [test._id.toString(), test]));

  const items = seriesList.map((series) => formatSeries(series, userId, testsById));

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function getTestSeriesById(id, userId) {
  const series = await TestSeries.findById(id).lean();

  if (!series) {
    throw new AppError('Test series not found', 404, 'NOT_FOUND');
  }

  const testIds = (series.mocks ?? []).map((mock) => mock.testId);
  const tests = await Test.find({ _id: { $in: testIds } })
    .select('title subject durationSec type')
    .lean();
  const testsById = new Map(tests.map((test) => [test._id.toString(), test]));

  return formatSeries(series, userId, testsById);
}

export async function enrollInTestSeries(id, userId) {
  const series = await TestSeries.findById(id);

  if (!series) {
    throw new AppError('Test series not found', 404, 'NOT_FOUND');
  }

  const alreadyEnrolled = series.enrolledUsers.some(
    (enrolledId) => enrolledId.toString() === userId.toString()
  );

  if (!alreadyEnrolled) {
    series.enrolledUsers.push(userId);
    await series.save();
  }

  return getTestSeriesById(id, userId);
}
