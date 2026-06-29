import { DoubtPost } from '../models/DoubtPost.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { embedDoubtPost } from './semantic/doubtSemanticService.js';
import { caseInsensitiveRegex } from '../utils/regex.js';

export async function listDoubts(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {};

  if (query.subject) {
    filters.subject = caseInsensitiveRegex(query.subject);
  }

  const [items, total] = await Promise.all([
    DoubtPost.find(filters)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    DoubtPost.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function createDoubt(userId, data) {
  return DoubtPost.create({
    userId,
    title: data.title,
    body: data.body,
    subject: data.subject,
  });
}

export async function addAnswer(userId, doubtId, body) {
  const doubt = await DoubtPost.findById(doubtId);

  if (!doubt) {
    throw new AppError('Doubt not found', 404, 'NOT_FOUND');
  }

  doubt.answers.push({ userId, body });
  await doubt.save();
  await embedDoubtPost(doubt).catch((err) => {
    console.warn(`[doubts] Failed to embed answered doubt ${doubt._id}: ${err.message}`);
  });

  return doubt;
}

export async function voteDoubt(userId, doubtId, { target, answerId }) {
  const doubt = await DoubtPost.findById(doubtId);

  if (!doubt) {
    throw new AppError('Doubt not found', 404, 'NOT_FOUND');
  }

  if (target === 'answer') {
    const answer = doubt.answers.id(answerId);

    if (!answer) {
      throw new AppError('Answer not found', 404, 'NOT_FOUND');
    }

    answer.votes = (answer.votes ?? 0) + 1;
  } else {
    doubt.votes = (doubt.votes ?? 0) + 1;
  }

  await doubt.save();
  return doubt;
}
