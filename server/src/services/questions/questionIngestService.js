import { Question } from '../../models/Question.js';
import { withAuditOnCreate } from '../../models/publishableFields.js';
import {
  appendDuplicateIssue,
  canPublishQuestion,
  resolveReviewStatus,
  runRuleChecks,
} from './questionQualityService.js';
import {
  ensureQuestionEmbedding,
  findSimilarQuestions,
} from '../semantic/questionSemanticService.js';

function normalizeOptions(options = []) {
  return options.map((option) => ({
    key: String(option.key).trim().toUpperCase(),
    text: String(option.text).trim(),
  }));
}

export function normalizeQuestionPayload(data) {
  return {
    subject: data.subject?.trim(),
    topic: data.topic?.trim(),
    difficulty: data.difficulty,
    text: data.text?.trim(),
    options: normalizeOptions(data.options),
    correctKey: String(data.correctKey).trim().toUpperCase(),
    explanation: data.explanation?.trim(),
    examTags: data.examTags ?? [],
    language: data.language ?? 'en',
  };
}

export async function evaluateQuestionQuality(questionLike, { excludeId } = {}) {
  const normalized = normalizeQuestionPayload(questionLike);
  const ruleIssues = runRuleChecks(normalized);

  let duplicate = null;

  if (!hasOnlyStructuralFailures(ruleIssues)) {
    const matches = await findSimilarQuestions({
      text: normalized.text,
      options: normalized.options,
      subject: normalized.subject,
      language: normalized.language,
      excludeId,
      limit: 1,
    });

    duplicate = matches[0] ?? null;
  }

  const qualityIssues = appendDuplicateIssue(ruleIssues, duplicate);

  return {
    normalized,
    qualityIssues,
    reviewStatus: resolveReviewStatus(qualityIssues),
    duplicateOf: duplicate?._id ?? null,
    duplicateScore: duplicate?.score != null ? Math.min(1, duplicate.score) : null,
  };
}

function hasOnlyStructuralFailures(issues) {
  return issues.some((issue) =>
    ['EMPTY_TEXT', 'INVALID_OPTION_COUNT', 'EMPTY_OPTION_TEXT'].includes(issue.code),
  );
}

export async function ingestQuestion(userId, data, { source, status = 'draft' } = {}) {
  const evaluation = await evaluateQuestionQuality(data);

  const question = await Question.create(
    withAuditOnCreate(
      {
        ...evaluation.normalized,
        source,
        status,
        reviewStatus: evaluation.reviewStatus,
        qualityIssues: evaluation.qualityIssues,
        duplicateOf: evaluation.duplicateOf,
        duplicateScore: evaluation.duplicateScore,
        qualityCheckedAt: new Date(),
      },
      userId,
    ),
  );

  await ensureQuestionEmbedding(question).catch(() => undefined);
  return question;
}

export async function reevaluateQuestion(questionDoc, updates = {}) {
  const merged = {
    subject: questionDoc.subject,
    topic: questionDoc.topic,
    difficulty: questionDoc.difficulty,
    text: questionDoc.text,
    options: questionDoc.options,
    correctKey: questionDoc.correctKey,
    explanation: questionDoc.explanation,
    examTags: questionDoc.examTags,
    language: questionDoc.language,
    ...updates,
  };

  const evaluation = await evaluateQuestionQuality(merged, { excludeId: questionDoc._id });

  questionDoc.set({
    ...evaluation.normalized,
    reviewStatus: evaluation.reviewStatus,
    qualityIssues: evaluation.qualityIssues,
    duplicateOf: evaluation.duplicateOf,
    duplicateScore: evaluation.duplicateScore,
    qualityCheckedAt: new Date(),
  });

  if (updates.text || updates.options) {
    questionDoc.embedding = undefined;
  }

  await questionDoc.save();

  if (updates.text || updates.options) {
    await ensureQuestionEmbedding(questionDoc).catch(() => undefined);
  }

  return questionDoc;
}

export function assertCanPublish(question) {
  return canPublishQuestion(question);
}

export async function ingestQuestionsBatch(userId, rows, { source }) {
  const inserted = [];

  for (const row of rows) {
    inserted.push(await ingestQuestion(userId, row, { source }));
  }

  return inserted;
}
