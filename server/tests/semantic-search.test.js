import { describe, expect, it } from '@jest/globals';
import { cosineSimilarity, rankBySimilarity } from '../src/services/embeddings/cosineSimilarity.js';
import { pickBestAnswer, buildDoubtSearchText } from '../src/services/semantic/doubtSemanticService.js';
import { buildQuestionSearchText } from '../src/services/semantic/questionSemanticService.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const vector = [0.2, 0.5, 0.7];
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
  });

  it('ranks documents by similarity score', () => {
    const query = [1, 0, 0];
    const ranked = rankBySimilarity(
      query,
      [
        { _id: 'a', embedding: [0.9, 0.1, 0] },
        { _id: 'b', embedding: [0, 1, 0] },
        { _id: 'c', embedding: [1, 0, 0] },
      ],
      { minScore: 0.5, limit: 2 },
    );

    expect(ranked.map((item) => item._id)).toEqual(['c', 'a']);
  });
});

describe('semantic text builders', () => {
  it('combines doubt title and body', () => {
    expect(buildDoubtSearchText({ title: 'GDP doubt', body: 'What is GDP?' })).toBe(
      'GDP doubt\nWhat is GDP?',
    );
  });

  it('picks the highest-voted answer', () => {
    const answer = pickBestAnswer([
      { body: 'Low votes', votes: 1, createdAt: new Date('2024-01-01') },
      { body: 'Best answer', votes: 5, createdAt: new Date('2024-01-02') },
    ]);

    expect(answer).toBe('Best answer');
  });

  it('includes options in question search text', () => {
    const text = buildQuestionSearchText({
      text: 'What is 2+2?',
      options: [
        { key: 'A', text: '3' },
        { key: 'B', text: '4' },
      ],
    });

    expect(text).toContain('What is 2+2?');
    expect(text).toContain('B. 4');
  });
});
