import { Question } from '../../models/Question.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { withAuditOnUpdate } from '../../models/publishableFields.js';
import { normalizeImportRow } from '../../validators/questionImportValidators.js';
import { parseImportPayload } from './questionImportService.js';
import {
  assertCanPublish,
  ingestQuestion,
  reevaluateQuestion,
} from '../questions/questionIngestService.js';
import { canPublishQuestion } from '../questions/questionQualityService.js';

function buildQuestionFilters(query) {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.subject) {
    filters.subject = { $regex: query.subject, $options: 'i' };
  }

  if (query.reviewStatus) {
    filters.reviewStatus = query.reviewStatus;
  }

  if (query.q) {
    filters.$text = { $search: query.q };
  }

  return filters;
}

function buildReviewQueueFilters() {
  return {
    reviewStatus: 'pending',
  };
}

export function formatQuestion(doc) {
  const duplicateOf =
    doc.duplicateOf && typeof doc.duplicateOf === 'object'
      ? {
          id: doc.duplicateOf._id?.toString?.() ?? String(doc.duplicateOf._id),
          text: doc.duplicateOf.text,
          subject: doc.duplicateOf.subject,
          topic: doc.duplicateOf.topic,
        }
      : doc.duplicateOf
        ? { id: doc.duplicateOf.toString() }
        : null;

  return {
    id: doc._id.toString(),
    subject: doc.subject,
    topic: doc.topic,
    difficulty: doc.difficulty,
    text: doc.text,
    options: doc.options,
    correctKey: doc.correctKey,
    explanation: doc.explanation,
    examTags: doc.examTags,
    source: doc.source,
    language: doc.language,
    status: doc.status ?? 'draft',
    reviewStatus: doc.reviewStatus ?? 'approved',
    qualityIssues: doc.qualityIssues ?? [],
    duplicateOf,
    duplicateScore: doc.duplicateScore,
    qualityCheckedAt: doc.qualityCheckedAt,
    canPublish: canPublishQuestion(doc),
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listQuestions(query) {
  const { limit, offset } = parsePagination(query);
  const filters = buildQuestionFilters(query);

  const finder = Question.find(filters)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(query.q ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
    .skip(offset)
    .limit(limit);

  const [items, total] = await Promise.all([finder.lean(), Question.countDocuments(filters)]);

  return buildPaginatedResult({
    items: items.map(formatQuestion),
    total,
    limit,
    offset,
  });
}

export async function listReviewQueue(query) {
  const { limit, offset } = parsePagination(query);
  const filters = buildReviewQueueFilters();

  if (query.subject) {
    filters.subject = { $regex: query.subject, $options: 'i' };
  }

  if (query.q) {
    filters.$text = { $search: query.q };
  }

  const finder = Question.find(filters)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('duplicateOf', 'text subject topic difficulty')
    .sort({ updatedAt: -1 })
    .skip(offset)
    .limit(limit);

  const [items, total] = await Promise.all([finder.lean(), Question.countDocuments(filters)]);

  return buildPaginatedResult({
    items: items.map(formatQuestion),
    total,
    limit,
    offset,
  });
}

export async function getQuestionById(id) {
  const question = await Question.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('duplicateOf', 'text subject topic difficulty')
    .lean();

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  return formatQuestion(question);
}

export async function createQuestion(userId, data) {
  const question = await ingestQuestion(userId, data, { source: 'official' });
  return getQuestionById(question._id);
}

export async function updateQuestion(userId, id, data) {
  const question = await Question.findById(id);

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  await reevaluateQuestion(question, data);
  question.set(withAuditOnUpdate({}, userId));
  await question.save();

  return getQuestionById(id);
}

export async function deleteQuestion(id) {
  const question = await Question.findByIdAndDelete(id);

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  return { id, deleted: true };
}

export async function setQuestionStatus(userId, id, status) {
  const question = await Question.findById(id);

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  if (status === 'published') {
    await reevaluateQuestion(question);
    question.set(withAuditOnUpdate({}, userId));

    if (!assertCanPublish(question)) {
      const blockingIssues = (question.qualityIssues ?? []).filter(
        (issue) => issue.severity === 'error',
      );
      const reason =
        question.reviewStatus !== 'approved'
          ? `Review status is "${question.reviewStatus}" — approve or fix issues before publishing`
          : blockingIssues.length
            ? blockingIssues.map((issue) => issue.message).join('; ')
            : 'Question must pass quality review before publishing';

      throw new AppError(reason, 400, 'QUALITY_GATE_FAILED', {
        qualityIssues: question.qualityIssues ?? [],
        reviewStatus: question.reviewStatus,
        canPublish: false,
      });
    }
  }

  question.status = status;
  question.set(withAuditOnUpdate({}, userId));
  await question.save();

  return getQuestionById(id);
}

export async function importQuestions(userId, payload) {
  const rows = parseImportPayload(payload);
  const rowErrors = [];
  const validRows = [];

  rows.forEach((row, index) => {
    const result = normalizeImportRow(row, index + 1);

    if (result.ok) {
      validRows.push(result.data);
      return;
    }

    rowErrors.push({
      row: result.rowNumber,
      errors: result.errors,
    });
  });

  const inserted = [];

  for (const row of validRows) {
    const question = await ingestQuestion(userId, row, { source: 'official' });
    inserted.push(formatQuestion(question.toObject()));
  }

  return {
    totalRows: rows.length,
    insertedCount: inserted.length,
    errorCount: rowErrors.length,
    pendingReviewCount: inserted.filter((item) => item.reviewStatus === 'pending').length,
    errors: rowErrors,
    inserted,
  };
}

export async function reviewQuestion(userId, id, { action, updates, mergeTargetId }) {
  const question = await Question.findById(id);

  if (!question) {
    throw new AppError('Question not found', 404, 'NOT_FOUND');
  }

  if (action === 'fix' || action === 'recheck') {
    await reevaluateQuestion(question, updates ?? {});
    question.set(withAuditOnUpdate({}, userId));
    await question.save();
    return getQuestionById(id);
  }

  if (action === 'merge') {
    if (!mergeTargetId) {
      throw new AppError('mergeTargetId is required to merge duplicates', 400, 'VALIDATION_ERROR');
    }

    const target = await Question.findById(mergeTargetId);

    if (!target) {
      throw new AppError('Merge target question not found', 404, 'NOT_FOUND');
    }

    question.duplicateOf = target._id;
    question.reviewStatus = 'rejected';
    question.status = 'draft';
    question.qualityIssues = [
      ...(question.qualityIssues ?? []).filter((issue) => issue.code !== 'NEAR_DUPLICATE'),
      {
        code: 'MERGED',
        message: `Merged into question ${target._id.toString()}`,
        severity: 'warning',
        metadata: { mergeTargetId: target._id.toString() },
      },
    ];
    question.set(withAuditOnUpdate({}, userId));
    await question.save();
    return getQuestionById(id);
  }

  if (action === 'reject') {
    question.reviewStatus = 'rejected';
    question.status = 'draft';
    question.set(withAuditOnUpdate({}, userId));
    await question.save();
    return getQuestionById(id);
  }

  throw new AppError('Unsupported review action', 400, 'VALIDATION_ERROR');
}

export async function mergeQuestion(userId, id, into) {
  return reviewQuestion(userId, id, { action: 'merge', mergeTargetId: into });
}

export async function countPendingQuestionReviews() {
  return Question.countDocuments({ reviewStatus: 'pending' });
}
