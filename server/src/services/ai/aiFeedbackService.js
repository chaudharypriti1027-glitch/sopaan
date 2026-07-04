import { AiModelFeedback } from '../../models/AiModelFeedback.js';
import { AnswerEvaluation } from '../../models/AnswerEvaluation.js';
import { Attempt } from '../../models/Attempt.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { createNotification } from '../notificationService.js';

function clampGrade(value, maxMarks) {
  return Math.min(maxMarks, Math.max(0, Math.round(value)));
}

function readSnapshotGrade(snapshot) {
  const score = snapshot?.score;
  return typeof score === 'number' && Number.isFinite(score) ? score : null;
}

function readMaxMarks(feedback, snapshot) {
  if (feedback.maxMarks) {
    return feedback.maxMarks;
  }

  const fromSnapshot = snapshot?.maxMarks;
  if (typeof fromSnapshot === 'number' && fromSnapshot > 0) {
    return fromSnapshot;
  }

  return 10;
}

function formatFeedbackItem(doc) {
  const user = doc.userId;
  const snapshot = doc.outputSnapshot ?? {};
  const aiGrade = readSnapshotGrade(snapshot);
  const maxMarks = readMaxMarks(doc, snapshot);
  const effectiveGrade = doc.finalGrade ?? aiGrade;

  return {
    id: doc._id.toString(),
    feature: doc.feature,
    status: doc.status,
    reason: doc.reason,
    userComment: doc.userComment ?? null,
    inputSummary: doc.inputSummary ?? null,
    questionText: doc.inputSummary ?? snapshot.question ?? null,
    outputSnapshot: snapshot,
    evaluationId: doc.evaluationId?.toString?.() ?? doc.evaluationId ?? null,
    attemptId: doc.attemptId?.toString?.() ?? doc.attemptId ?? null,
    maxMarks,
    aiGrade,
    finalGrade: doc.finalGrade ?? null,
    effectiveGrade,
    reviewAction: doc.reviewAction ?? null,
    adminNotes: doc.adminNotes ?? null,
    student: {
      id: user?._id?.toString?.() ?? user?.id ?? null,
      name: user?.name ?? 'Student',
      email: user?.email ?? null,
    },
    userName: user?.name ?? 'Student',
    reviewedAt: doc.reviewedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function ensureAnswerEvaluation(feedback, snapshot) {
  if (feedback.evaluationId) {
    return AnswerEvaluation.findById(feedback.evaluationId);
  }

  if (feedback.feature !== 'answer_evaluation') {
    return null;
  }

  const maxMarks = readMaxMarks(feedback, snapshot);
  const aiGrade = readSnapshotGrade(snapshot);

  if (aiGrade == null) {
    return null;
  }

  const evaluation = await AnswerEvaluation.create({
    userId: feedback.userId,
    question: feedback.inputSummary ?? 'Answer evaluation',
    maxMarks,
    score: aiGrade,
    subScores: snapshot.subScores ?? {},
    feedback: Array.isArray(snapshot.feedback) ? snapshot.feedback : [],
    reviewStatus: 'pending',
    attemptId: feedback.attemptId ?? null,
  });

  feedback.evaluationId = evaluation._id;
  feedback.maxMarks = maxMarks;
  await feedback.save();

  return evaluation;
}

async function applyGradeToAttempt(attemptId, grade, maxMarks) {
  if (!attemptId) {
    return null;
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    return null;
  }

  const accuracy = Math.round((grade / maxMarks) * 100);
  attempt.score = grade;
  attempt.accuracy = Math.min(100, Math.max(0, accuracy));
  await attempt.save();
  return attempt;
}

export async function reportAiOutput(userId, payload) {
  const maxMarks =
    payload.maxMarks ??
    (typeof payload.outputSnapshot?.maxMarks === 'number'
      ? payload.outputSnapshot.maxMarks
      : undefined);

  return AiModelFeedback.create({
    userId,
    feature: payload.feature,
    reason: payload.reason ?? 'other',
    userComment: payload.userComment,
    inputSummary: payload.inputSummary,
    outputSnapshot: payload.outputSnapshot,
    evaluationId: payload.evaluationId ?? null,
    attemptId: payload.attemptId ?? null,
    maxMarks: maxMarks ?? null,
    status: 'pending',
  });
}

export async function persistAnswerEvaluation(userId, payload, result) {
  const evaluation = await AnswerEvaluation.create({
    userId,
    question: payload.question,
    answerText: payload.answerText ?? null,
    maxMarks: payload.maxMarks,
    score: result.score,
    subScores: result.subScores,
    feedback: result.feedback,
    reviewStatus: 'none',
    attemptId: payload.attemptId ?? null,
  });

  return evaluation;
}

export async function listAiFeedback(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  } else {
    filters.status = 'pending';
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

  return buildPaginatedResult({
    items: items.map(formatFeedbackItem),
    total,
    limit,
    offset,
  });
}

export async function reviewAiFeedback(feedbackId, { action, grade, note }, adminUserId) {
  const feedback = await AiModelFeedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404, 'NOT_FOUND');
  }

  if (feedback.status !== 'pending') {
    throw new AppError('This feedback was already reviewed', 409, 'ALREADY_REVIEWED');
  }

  const snapshot = { ...(feedback.outputSnapshot ?? {}) };
  const maxMarks = readMaxMarks(feedback, snapshot);

  feedback.reviewedBy = adminUserId;
  feedback.reviewedAt = new Date();
  feedback.reviewAction = action;
  feedback.adminNotes = note ?? feedback.adminNotes ?? null;
  feedback.status = 'reviewed';

  if (action === 'keep') {
    const evaluation = await ensureAnswerEvaluation(feedback, snapshot);
    if (evaluation) {
      evaluation.reviewStatus = 'kept';
      evaluation.adminNote = note ?? evaluation.adminNote;
      await evaluation.save();
    }

    await feedback.save();
    return formatFeedbackItem(feedback.toObject());
  }

  if (action !== 'override') {
    throw new AppError('Invalid review action', 400, 'INVALID_ACTION');
  }

  if (grade == null || !Number.isFinite(Number(grade))) {
    throw new AppError('grade is required when overriding', 400, 'GRADE_REQUIRED');
  }

  const finalGrade = clampGrade(Number(grade), maxMarks);
  feedback.finalGrade = finalGrade;
  snapshot.score = finalGrade;
  snapshot.maxMarks = maxMarks;
  feedback.outputSnapshot = snapshot;
  feedback.maxMarks = maxMarks;

  const evaluation = await ensureAnswerEvaluation(feedback, snapshot);
  if (evaluation) {
    evaluation.score = finalGrade;
    evaluation.reviewStatus = 'overridden';
    evaluation.adminNote = note ?? evaluation.adminNote;
    await evaluation.save();
  }

  if (feedback.attemptId) {
    await applyGradeToAttempt(feedback.attemptId, finalGrade, maxMarks);
  }

  await feedback.save();

  await createNotification(feedback.userId, {
    type: 'mentor',
    title: 'Your answer score was updated',
    body:
      note?.trim() ||
      `A mentor reviewed your answer. Updated score: ${finalGrade}/${maxMarks}.`,
    data: {
      feedbackId: feedback._id.toString(),
      evaluationId: feedback.evaluationId?.toString?.() ?? null,
      grade: finalGrade,
      maxMarks,
      screen: 'AnswerEvaluation',
    },
  });

  return formatFeedbackItem(feedback.toObject());
}

/** @deprecated use reviewAiFeedback */
export async function updateAiFeedbackStatus(feedbackId, body, adminUserId) {
  const action = body.status === 'reviewed' ? 'keep' : 'override';
  return reviewAiFeedback(
    feedbackId,
    { action, grade: body.grade, note: body.adminNotes },
    adminUserId,
  );
}
