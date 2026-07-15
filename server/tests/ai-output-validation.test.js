import { describe, expect, it } from '@jest/globals';
import {
  validateAnswerEvaluation,
  validateQuestionBatch,
} from '../src/services/ai/outputValidation.js';

describe('outputValidation', () => {
  it('accepts evaluation scores within max marks', () => {
    const result = validateAnswerEvaluation(
      {
        score: 8,
        subScores: { content: 7, structure: 6, clarity: 8 },
        feedback: ['Add examples', 'Strong intro'],
      },
      10,
    );

    expect(result.score).toBe(8);
    expect(result.subScores.content).toBe(7);
    expect(result.strengths).toEqual([]);
    expect(result.nextSteps).toEqual([]);
  });

  it('accepts optional strengths and nextSteps lists', () => {
    const result = validateAnswerEvaluation(
      {
        score: 8,
        subScores: { content: 7, structure: 6, clarity: 8 },
        strengths: ['  Clear opening  '],
        feedback: ['Add one example'],
        nextSteps: ['Rewrite conclusion', 'Practice one timed answer'],
      },
      10,
    );

    expect(result.strengths).toEqual(['Clear opening']);
    expect(result.nextSteps).toEqual(['Rewrite conclusion', 'Practice one timed answer']);
  });

  it('treats null strengths and nextSteps as empty arrays', () => {
    const result = validateAnswerEvaluation(
      {
        score: 5,
        subScores: { content: 5, structure: 5, clarity: 5 },
        strengths: null,
        feedback: ['Keep practicing'],
        nextSteps: null,
      },
      10,
    );

    expect(result.strengths).toEqual([]);
    expect(result.nextSteps).toEqual([]);
  });

  it('rejects evaluation scores above max marks', () => {
    expect(() =>
      validateAnswerEvaluation(
        {
          score: 12,
          subScores: { content: 4, structure: 4, clarity: 4 },
          feedback: ['Too high'],
        },
        10,
      ),
    ).toThrow(/between 0 and 10/);
  });

  it('rejects questions without four valid option keys', () => {
    expect(() =>
      validateQuestionBatch(
        [
          {
            text: 'Sample question?',
            options: [
              { key: 'A', text: 'One' },
              { key: 'B', text: 'Two' },
              { key: 'C', text: 'Three' },
            ],
            correctKey: 'A',
            explanation: 'Because',
            topic: 'General',
            difficulty: 'easy',
          },
        ],
        1,
      ),
    ).toThrow(/validation failed/i);
  });

  it('accepts a valid generated question batch', () => {
    const questions = validateQuestionBatch(
      [
        {
          text: 'What is 2+2?',
          options: [
            { key: 'A', text: '3' },
            { key: 'B', text: '4' },
            { key: 'C', text: '5' },
            { key: 'D', text: '6' },
          ],
          correctKey: 'B',
          explanation: 'Basic addition',
          topic: 'Math',
          difficulty: 'easy',
        },
      ],
      1,
    );

    expect(questions).toHaveLength(1);
    expect(questions[0].correctKey).toBe('B');
  });
});
