import { Test } from '../../models/Test.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

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

  return buildPaginatedResult({ items, total, limit, offset });
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

  return test.populate('createdBy', 'name email');
}
