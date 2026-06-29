import { describe, expect, it } from '@jest/globals';
import { parseCsvQuestions } from '../src/services/admin/questionImportService.js';
import { normalizeImportRow } from '../src/validators/questionImportValidators.js';

describe('question import', () => {
  it('parses CSV rows with option columns', () => {
    const rows = parseCsvQuestions(`subject,topic,difficulty,text,optionA,optionB,optionC,optionD,correctKey,explanation,examTags
Polity,Fundamental Rights,medium,Which article abolishes untouchability?,Article 14,Article 17,Article 21,Article 32,B,Article 17 abolishes untouchability.,UPSC;SSC`);

    expect(rows).toHaveLength(1);

    const validated = normalizeImportRow(rows[0], 1);
    expect(validated.ok).toBe(true);
    expect(validated.data.correctKey).toBe('B');
    expect(validated.data.examTags).toEqual(['UPSC', 'SSC']);
  });

  it('reports row-level validation errors', () => {
    const validated = normalizeImportRow(
      {
        subject: 'Math',
        topic: 'Algebra',
        difficulty: 'easy',
        text: 'Bad question',
        options: [
          { key: 'A', text: '1' },
          { key: 'B', text: '2' },
          { key: 'C', text: '3' },
        ],
        correctKey: 'Z',
        explanation: 'Missing option',
      },
      2,
    );

    expect(validated.ok).toBe(false);
    expect(validated.errors.length).toBeGreaterThan(0);
  });
});
