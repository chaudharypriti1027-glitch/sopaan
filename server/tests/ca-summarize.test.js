import { describe, expect, it } from '@jest/globals';
import { validateSummarizeForAspirantsResponse } from '../src/services/ai/summarizeForAspirants.js';

const validPayload = {
  summary:
    'India announced a new skill development scheme focused on youth employment and vocational training centres across districts.',
  shortAnswer: 'A new national skill development scheme targets youth employment via district training centres.',
  examTip: 'Link scheme name, ministry, and launch year when revising government schemes.',
  keyPoints: [
    'Focus on youth employment',
    'District-level training centres',
    'Vocational skills emphasis',
  ],
  category: 'Schemes',
  quizQuestions: [
    {
      text: 'What is the primary focus of the newly announced skill development scheme?',
      options: [
        { key: 'A', text: 'Defence procurement' },
        { key: 'B', text: 'Youth employment and training' },
        { key: 'C', text: 'Space exploration' },
        { key: 'D', text: 'Railway fares' },
      ],
      correctKey: 'B',
      explanation: 'The scheme targets youth employment through training centres.',
      topic: 'Government Schemes',
      difficulty: 'easy',
    },
    {
      text: 'Which sector does the scheme mainly address according to the summary?',
      options: [
        { key: 'A', text: 'Agriculture subsidies' },
        { key: 'B', text: 'Skill development' },
        { key: 'C', text: 'Foreign policy' },
        { key: 'D', text: 'Judicial appointments' },
      ],
      correctKey: 'B',
      explanation: 'The announcement concerns skill development and employment.',
      topic: 'Government Schemes',
      difficulty: 'medium',
    },
    {
      text: 'The scheme involves setting up training centres at which level?',
      options: [
        { key: 'A', text: 'District level' },
        { key: 'B', text: 'Only national capital' },
        { key: 'C', text: 'Embassies abroad' },
        { key: 'D', text: 'Private clubs' },
      ],
      correctKey: 'A',
      explanation: 'The summary mentions district-level training centres.',
      topic: 'Government Schemes',
      difficulty: 'easy',
    },
  ],
};

describe('summarizeForAspirants validation', () => {
  it('accepts a valid summary payload with 3 quiz questions', () => {
    const result = validateSummarizeForAspirantsResponse(validPayload);

    expect(result.summary).toContain('skill development');
    expect(result.category).toBe('Schemes');
    expect(result.quizQuestions).toHaveLength(3);
  });

  it('rejects payloads without exactly 3 questions', () => {
    expect(() =>
      validateSummarizeForAspirantsResponse({
        ...validPayload,
        quizQuestions: validPayload.quizQuestions.slice(0, 2),
      }),
    ).toThrow();
  });
});
