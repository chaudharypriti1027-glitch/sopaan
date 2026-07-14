import { describe, expect, it } from '@jest/globals';
import {
  buildAiSummaryResponse,
  hasAiStudyPack,
} from '../src/services/currentAffairService.js';

describe('current affair AI summary helpers', () => {
  it('detects cached study packs with short answer or tip + key points', () => {
    expect(
      hasAiStudyPack({
        shortAnswer: 'RBI held rates steady.',
      }),
    ).toBe(true);

    expect(
      hasAiStudyPack({
        examTip: 'Link policy rate and inflation.',
        keyPoints: ['Repo unchanged', 'Inflation watch'],
      }),
    ).toBe(true);

    expect(
      hasAiStudyPack({
        summary: 'Only a raw summary',
        keyPoints: [],
      }),
    ).toBe(false);
  });

  it('builds a public AI summary payload', () => {
    const result = buildAiSummaryResponse(
      {
        id: 'ca-1',
        title: 'RBI keeps repo rate unchanged',
        summary: 'Repo rate held at 6.5%.',
        shortAnswer: 'RBI left the repo rate unchanged.',
        examTip: 'Link RBI, repo rate, and inflation context.',
        keyPoints: ['Repo rate unchanged'],
        category: 'Economy',
      },
      null,
      'cached',
    );

    expect(result.affairId).toBe('ca-1');
    expect(result.source).toBe('cached');
    expect(result.shortAnswer).toContain('unchanged');
    expect(result.keyPoints).toHaveLength(1);
  });
});
