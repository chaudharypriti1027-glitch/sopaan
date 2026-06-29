import { env } from '../../config/env.js';

export const QUESTION_LIMITS = Object.freeze({
  textMin: 10,
  textMax: 2000,
  explanationMin: 10,
  explanationMax: 2000,
  optionTextMax: 500,
});

export const VALID_OPTION_KEYS = ['A', 'B', 'C', 'D'];

export const QUALITY_ISSUE_CODES = Object.freeze({
  EMPTY_TEXT: 'EMPTY_TEXT',
  TEXT_TOO_SHORT: 'TEXT_TOO_SHORT',
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  MISSING_EXPLANATION: 'MISSING_EXPLANATION',
  EXPLANATION_TOO_SHORT: 'EXPLANATION_TOO_SHORT',
  EXPLANATION_TOO_LONG: 'EXPLANATION_TOO_LONG',
  INVALID_OPTION_COUNT: 'INVALID_OPTION_COUNT',
  DUPLICATE_OPTION_KEYS: 'DUPLICATE_OPTION_KEYS',
  DUPLICATE_OPTION_TEXT: 'DUPLICATE_OPTION_TEXT',
  INVALID_CORRECT_KEY: 'INVALID_CORRECT_KEY',
  EMPTY_OPTION_TEXT: 'EMPTY_OPTION_TEXT',
  OPTION_TOO_LONG: 'OPTION_TOO_LONG',
  NEAR_DUPLICATE: 'NEAR_DUPLICATE',
});

/**
 * @typedef {'error' | 'warning'} QualitySeverity
 * @typedef {{ code: string, message: string, severity: QualitySeverity, metadata?: object }} QualityIssue
 */

/**
 * @param {object} question
 * @returns {QualityIssue[]}
 */
export function runRuleChecks(question) {
  const issues = [];
  const text = question.text?.trim() ?? '';
  const explanation = question.explanation?.trim() ?? '';
  const options = question.options ?? [];

  if (!text) {
    issues.push(issue(QUALITY_ISSUE_CODES.EMPTY_TEXT, 'Question text is required', 'error'));
  } else if (text.length < QUESTION_LIMITS.textMin) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.TEXT_TOO_SHORT,
        `Question text must be at least ${QUESTION_LIMITS.textMin} characters`,
        'error',
      ),
    );
  } else if (text.length > QUESTION_LIMITS.textMax) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.TEXT_TOO_LONG,
        `Question text must be at most ${QUESTION_LIMITS.textMax} characters`,
        'error',
      ),
    );
  }

  if (!explanation) {
    issues.push(
      issue(QUALITY_ISSUE_CODES.MISSING_EXPLANATION, 'Explanation is required', 'error'),
    );
  } else if (explanation.length < QUESTION_LIMITS.explanationMin) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.EXPLANATION_TOO_SHORT,
        `Explanation must be at least ${QUESTION_LIMITS.explanationMin} characters`,
        'error',
      ),
    );
  } else if (explanation.length > QUESTION_LIMITS.explanationMax) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.EXPLANATION_TOO_LONG,
        `Explanation must be at most ${QUESTION_LIMITS.explanationMax} characters`,
        'error',
      ),
    );
  }

  if (options.length !== 4) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.INVALID_OPTION_COUNT,
        'Question must have exactly 4 options',
        'error',
      ),
    );
  }

  const keys = options.map((option) => option.key?.toUpperCase?.() ?? option.key);
  const optionTexts = options.map((option) => option.text?.trim?.() ?? '');

  if (new Set(keys).size !== keys.length) {
    issues.push(
      issue(QUALITY_ISSUE_CODES.DUPLICATE_OPTION_KEYS, 'Option keys must be unique', 'error'),
    );
  }

  if (!VALID_OPTION_KEYS.every((key) => keys.includes(key))) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.INVALID_OPTION_COUNT,
        'Options must use keys A, B, C, and D exactly once',
        'error',
      ),
    );
  }

  const normalizedTexts = optionTexts.map((value) => value.toLowerCase()).filter(Boolean);
  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.DUPLICATE_OPTION_TEXT,
        'Option text values must be distinct',
        'error',
      ),
    );
  }

  for (const optionText of optionTexts) {
    if (!optionText) {
      issues.push(
        issue(QUALITY_ISSUE_CODES.EMPTY_OPTION_TEXT, 'Each option must have text', 'error'),
      );
      break;
    }

    if (optionText.length > QUESTION_LIMITS.optionTextMax) {
      issues.push(
        issue(
          QUALITY_ISSUE_CODES.OPTION_TOO_LONG,
          `Option text must be at most ${QUESTION_LIMITS.optionTextMax} characters`,
          'error',
        ),
      );
      break;
    }
  }

  const correctKey = question.correctKey?.toUpperCase?.() ?? question.correctKey;
  const matchingKeys = keys.filter((key) => key === correctKey);

  if (!correctKey || matchingKeys.length !== 1) {
    issues.push(
      issue(
        QUALITY_ISSUE_CODES.INVALID_CORRECT_KEY,
        'correctKey must match exactly one option key',
        'error',
      ),
    );
  }

  return issues;
}

/**
 * @param {QualityIssue[]} issues
 */
export function hasBlockingQualityIssues(issues) {
  return issues.some((item) => item.severity === 'error');
}

/**
 * @param {object} question
 */
export function canPublishQuestion(question) {
  const reviewStatus = question.reviewStatus ?? 'approved';

  if (reviewStatus === 'rejected') {
    return false;
  }

  if (reviewStatus !== 'approved') {
    return false;
  }

  return !hasBlockingQualityIssues(question.qualityIssues ?? []);
}

/**
 * @param {QualityIssue[]} ruleIssues
 * @param {{ _id?: object, score?: number, text?: string } | null} duplicate
 * @returns {QualityIssue[]}
 */
export function appendDuplicateIssue(ruleIssues, duplicate) {
  if (!duplicate) {
    return ruleIssues;
  }

  return [
    ...ruleIssues,
    issue(
      QUALITY_ISSUE_CODES.NEAR_DUPLICATE,
      `Near-duplicate of existing question (${Math.round((duplicate.score ?? 0) * 100)}% similar)`,
      'error',
      {
        questionId: duplicate._id?.toString?.() ?? String(duplicate._id),
        score: duplicate.score,
        preview: duplicate.text?.slice(0, 120),
      },
    ),
  ];
}

/**
 * @param {QualityIssue[]} issues
 */
export function resolveReviewStatus(issues) {
  return hasBlockingQualityIssues(issues) ? 'pending' : 'approved';
}

function issue(code, message, severity, metadata) {
  return metadata ? { code, message, severity, metadata } : { code, message, severity };
}

export function duplicateReviewThreshold() {
  return env.questionSimilarityThreshold;
}
