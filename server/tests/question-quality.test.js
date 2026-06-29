import { describe, expect, it } from '@jest/globals';
import {
  QUALITY_ISSUE_CODES,
  QUESTION_LIMITS,
  runRuleChecks,
  canPublishQuestion,
  resolveReviewStatus,
} from '../src/services/questions/questionQualityService.js';

const validQuestion = {
  text: 'Which article of the Indian Constitution abolishes untouchability?',
  explanation: 'Article 17 explicitly abolishes untouchability and forbids its practice in any form.',
  options: [
    { key: 'A', text: 'Article 14' },
    { key: 'B', text: 'Article 17' },
    { key: 'C', text: 'Article 21' },
    { key: 'D', text: 'Article 32' },
  ],
  correctKey: 'B',
};

describe('question quality rules', () => {
  it('passes valid questions', () => {
    const issues = runRuleChecks(validQuestion);
    expect(issues).toHaveLength(0);
    expect(resolveReviewStatus(issues)).toBe('approved');
  });

  it('flags empty text', () => {
    const issues = runRuleChecks({ ...validQuestion, text: '   ' });
    expect(issues.some((issue) => issue.code === QUALITY_ISSUE_CODES.EMPTY_TEXT)).toBe(true);
  });

  it('flags short text and explanation', () => {
    const issues = runRuleChecks({
      ...validQuestion,
      text: 'Too short',
      explanation: 'Short',
    });

    expect(issues.some((issue) => issue.code === QUALITY_ISSUE_CODES.TEXT_TOO_SHORT)).toBe(true);
    expect(issues.some((issue) => issue.code === QUALITY_ISSUE_CODES.EXPLANATION_TOO_SHORT)).toBe(
      true,
    );
  });

  it('flags non-distinct options and invalid correctKey', () => {
    const issues = runRuleChecks({
      ...validQuestion,
      options: [
        { key: 'A', text: 'Same answer' },
        { key: 'B', text: 'Same answer' },
        { key: 'C', text: 'Other' },
        { key: 'D', text: 'Another' },
      ],
      correctKey: 'Z',
    });

    expect(issues.some((issue) => issue.code === QUALITY_ISSUE_CODES.DUPLICATE_OPTION_TEXT)).toBe(
      true,
    );
    expect(issues.some((issue) => issue.code === QUALITY_ISSUE_CODES.INVALID_CORRECT_KEY)).toBe(
      true,
    );
  });

  it('flags wrong option count', () => {
    const issues = runRuleChecks({
      ...validQuestion,
      options: validQuestion.options.slice(0, 3),
    });

    expect(issues.some((issue) => issue.code === QUALITY_ISSUE_CODES.INVALID_OPTION_COUNT)).toBe(
      true,
    );
  });

  it('blocks publish when review is pending or rejected', () => {
    expect(
      canPublishQuestion({
        reviewStatus: 'approved',
        qualityIssues: [],
      }),
    ).toBe(true);

    expect(
      canPublishQuestion({
        reviewStatus: 'pending',
        qualityIssues: [{ code: 'NEAR_DUPLICATE', severity: 'error', message: 'dup' }],
      }),
    ).toBe(false);

    expect(
      canPublishQuestion({
        reviewStatus: 'rejected',
        qualityIssues: [],
      }),
    ).toBe(false);
  });

  it('uses configured length limits', () => {
    expect(QUESTION_LIMITS.textMin).toBeGreaterThan(0);
    expect(QUESTION_LIMITS.explanationMin).toBeGreaterThan(0);
  });
});
