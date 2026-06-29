import { AiModelFeedback } from '../../models/AiModelFeedback.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

export async function reportAiOutput(userId, payload) {
  return AiModelFeedback.create({
    userId,
    feature: payload.feature,
    reason: payload.reason ?? 'other',
    userComment: payload.userComment,
    inputSummary: payload.inputSummary,
    outputSnapshot: payload.outputSnapshot,
    status: 'pending',
  });
}

export async function listAiFeedback(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.feature) {
    filters.feature = query.feature;
  }

  const [items, total] = await Promise.all([
    AiModelFeedback.find(filters)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    AiModelFeedback.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function updateAiFeedbackStatus(feedbackId, { status, adminNotes }, adminUserId) {
  const feedback = await AiModelFeedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'NOT_FOUND');
  }

  feedback.status = status;
  feedback.adminNotes = adminNotes;
  feedback.reviewedBy = adminUserId;
  feedback.reviewedAt = new Date();
  await feedback.save();

  return feedback;
}
