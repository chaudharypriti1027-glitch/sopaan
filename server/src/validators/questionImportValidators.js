import { z } from 'zod';

const optionSchema = z.object({
  key: z.string().trim().toUpperCase(),
  text: z.string().trim().min(1),
});

export const importQuestionRowSchema = z.object({
  subject: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  text: z.string().trim().min(1),
  options: z.array(optionSchema).length(4),
  correctKey: z.string().trim().toUpperCase(),
  explanation: z.string().trim().min(1),
  examTags: z.array(z.string().trim().min(1)).default([]),
  language: z.enum(['en', 'hi']).default('en'),
});

export const questionImportBodySchema = z.object({
  questions: z.array(z.record(z.unknown())).min(1).max(500),
});

export const questionCreateSchema = importQuestionRowSchema.extend({
  status: z.enum(['draft', 'published']).optional(),
});

export const questionUpdateSchema = questionCreateSchema.partial();

export const publishStatusSchema = z.object({
  status: z.enum(['draft', 'published']),
});

export const adminContentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().optional(),
  status: z.enum(['draft', 'published']).optional(),
  reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  subject: z.string().trim().optional(),
});

export const questionReviewSchema = z.object({
  action: z.enum(['fix', 'recheck', 'merge', 'reject']),
  mergeTargetId: z.string().trim().optional(),
  updates: questionUpdateSchema.optional(),
});

export const questionMergeSchema = z.object({
  into: z.string().trim().min(1),
});

const VALID_OPTION_KEYS = ['A', 'B', 'C', 'D'];

export function normalizeImportRow(rawRow, rowNumber) {
  const row = normalizeRawImportRow(rawRow);
  const parsed = importQuestionRowSchema.safeParse(row);

  if (!parsed.success) {
    return {
      ok: false,
      rowNumber,
      errors: parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'row',
        message: issue.message,
      })),
    };
  }

  const keys = parsed.data.options.map((option) => option.key);
  const structuralErrors = [];

  if (!VALID_OPTION_KEYS.every((key) => keys.includes(key))) {
    structuralErrors.push({
      field: 'options',
      message: 'options must use keys A, B, C, and D exactly once',
    });
  }

  if (new Set(keys).size !== 4) {
    structuralErrors.push({
      field: 'options',
      message: 'options must have unique keys',
    });
  }

  if (!keys.includes(parsed.data.correctKey)) {
    structuralErrors.push({
      field: 'correctKey',
      message: 'correctKey must match one of the option keys',
    });
  }

  if (structuralErrors.length) {
    return { ok: false, rowNumber, errors: structuralErrors };
  }

  return { ok: true, rowNumber, data: parsed.data };
}

function normalizeRawImportRow(rawRow) {
  if (rawRow.options?.length === 4) {
    return {
      ...rawRow,
      examTags: normalizeExamTags(rawRow.examTags),
      options: rawRow.options.map((option) => ({
        key: String(option.key).trim().toUpperCase(),
        text: String(option.text).trim(),
      })),
      correctKey: String(rawRow.correctKey).trim().toUpperCase(),
    };
  }

  return {
    subject: rawRow.subject,
    topic: rawRow.topic,
    difficulty: String(rawRow.difficulty ?? '').trim().toLowerCase(),
    text: rawRow.text,
    options: [
      { key: 'A', text: rawRow.optionA ?? rawRow.option_a ?? '' },
      { key: 'B', text: rawRow.optionB ?? rawRow.option_b ?? '' },
      { key: 'C', text: rawRow.optionC ?? rawRow.option_c ?? '' },
      { key: 'D', text: rawRow.optionD ?? rawRow.option_d ?? '' },
    ],
    correctKey: rawRow.correctKey ?? rawRow.correct_key,
    explanation: rawRow.explanation ?? '',
    examTags: normalizeExamTags(rawRow.examTags ?? rawRow.exam_tags),
    language: rawRow.language ?? 'en',
  };
}

function normalizeExamTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(/[;,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}
