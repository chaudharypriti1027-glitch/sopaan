import { describe, expect, it } from '@jest/globals';
import {
  filterExamRelevantArticles,
  isExamRelevantArticle,
} from '../src/services/currentAffairs/newsRelevanceFilter.js';

describe('newsRelevanceFilter', () => {
  it('rejects entertainment headlines', () => {
    expect(
      isExamRelevantArticle({
        title: 'Bollywood actor announces new movie release date',
        body: 'Fans celebrate the trailer launch.',
      }),
    ).toBe(false);
  });

  it('accepts government and policy headlines', () => {
    expect(
      isExamRelevantArticle({
        title: 'Union government launches new welfare scheme for farmers',
        body: 'The ministry announced the policy in parliament today.',
      }),
    ).toBe(true);
  });

  it('filters a mixed batch', () => {
    const items = filterExamRelevantArticles([
      { title: 'IPL final tickets sold out in minutes', body: 'Cricket fans queued overnight.' },
      { title: 'Gujarat government inaugurates new skill mission', body: 'Chief Minister addressed the assembly.' },
    ], { state: 'Gujarat' });

    expect(items).toHaveLength(1);
    expect(items[0].title).toContain('Gujarat');
  });
});
