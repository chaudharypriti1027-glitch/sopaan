import { Test } from '../../models/Test.js';
import { AppError } from '../../utils/AppError.js';
import { CONTENT_DOMAINS, notifyStudentsContentUpdated } from '../contentSyncService.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

export function formatPendingTest(doc) {
  const createdBy =
    doc.createdBy && typeof doc.createdBy === 'object'
      ? {
          id: doc.createdBy._id?.toString?.() ?? String(doc.createdBy._id),
          name: doc.createdBy.name,
          email: doc.createdBy.email ?? null,
        }
      : null;

  const questionCount = Array.isArray(doc.questions)
    ? doc.questions.length
    : typeof doc.questionCount === 'number'
      ? doc.questionCount
      : 0;

  const isAiMock = doc.type === 'mock';

  return {
    id: doc._id?.toString?.() ?? doc.id,
    title: doc.title,
    subject: doc.subject,
    topic: doc.topic,
    type: doc.type,
    examTag: doc.examTag,
    status: doc.status,
    difficulty: doc.difficulty,
    durationSec: doc.durationSec,
    questionCount,
    source: isAiMock ? 'AI generator' : 'Community',
    createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listPendingTests(query) {
  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    Test.find({ status: 'pending_review' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Test.countDocuments({ status: 'pending_review' }),
  ]);

  return buildPaginatedResult({
    items: items.map(formatPendingTest),
    total,
    limit,
    offset,
  });
}

export async function reviewTest(testId, decision) {
  const test = await Test.findById(testId);

  if (!test) {
    throw new AppError('Test not found', 404, 'NOT_FOUND');
  }

  if (test.status !== 'pending_review') {
    throw new AppError('Only tests pending review can be moderated', 400, 'INVALID_STATUS');
  }

  test.status = decision === 'approve' ? 'published' : 'rejected';
  await test.save();

  if (decision === 'approve') {
    notifyStudentsContentUpdated(CONTENT_DOMAINS.TESTS, { action: 'publish', testId: test._id.toString() });
  }

  const populated = await test.populate('createdBy', 'name email');
  return formatPendingTest(populated.toObject());
}
