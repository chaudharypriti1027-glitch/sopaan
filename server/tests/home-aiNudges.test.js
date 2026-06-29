import { describe, expect, it } from '@jest/globals';
import {
  buildFallbackNudges,
  hashNudgeState,
  parseAndValidateNudges,
  topicToSlug,
} from '../src/services/home/aiNudges.js';

describe('getAINudges helpers', () => {
  it('hashes state deterministically regardless of key order', () => {
    const left = {
      streak: 3,
      todayDone: false,
      daysToExam: 10,
      rankDeltaWeek: 2,
      weakestTopics: [{ name: 'Polity', acc: 40 }],
      lastMockPct: 55,
    };
    const right = {
      lastMockPct: 55,
      weakestTopics: [{ name: 'Polity', acc: 40 }],
      rankDeltaWeek: 2,
      daysToExam: 10,
      todayDone: false,
      streak: 3,
    };

    expect(hashNudgeState(left)).toBe(hashNudgeState(right));
  });

  it('validates nudge shape and word limits', () => {
    const raw = [
      {
        tone: 'urgent',
        icon: 'target',
        title: 'Drill Indian Polity now',
        body: 'Your accuracy is low — start a quick drill.',
        deeplink: '/drill/indian-polity',
      },
      {
        tone: 'invalid',
        icon: 'x',
        title: 'Bad',
        body: 'Bad',
        deeplink: '/x',
      },
      {
        tone: 'info',
        icon: 'newspaper',
        title: 'This title has way too many words in it',
        body: 'Short body.',
        deeplink: '/tabs/CurrentAffairs',
      },
    ];

    const nudges = parseAndValidateNudges(raw);

    expect(nudges).toHaveLength(1);
    expect(nudges[0]).toMatchObject({
      tone: 'urgent',
      title: 'Drill Indian Polity now',
      deeplink: '/drill/indian-polity',
    });
    expect(nudges[0].id).toEqual(expect.any(String));
  });

  it('parses JSON wrapped in code fences', () => {
    const text = '```json\n[{"tone":"info","icon":"book-open","title":"Read affairs","body":"Three new articles today.","deeplink":"/tabs/CurrentAffairs"}]\n```';
    const nudges = parseAndValidateNudges(text);

    expect(nudges).toHaveLength(1);
    expect(nudges[0].tone).toBe('info');
  });

  it('builds deterministic fallback from weakest topic', () => {
    const nudges = buildFallbackNudges({
      streak: 1,
      todayDone: true,
      daysToExam: 90,
      weakestTopics: [{ name: 'Indian Polity', acc: 42 }],
      lastMockPct: 70,
      rankDeltaWeek: 0,
    });

    expect(nudges[0]).toMatchObject({
      tone: 'urgent',
      deeplink: `/drill/${topicToSlug('Indian Polity')}`,
    });
  });

  it('always returns at least one fallback nudge', () => {
    const nudges = buildFallbackNudges({
      streak: 0,
      todayDone: false,
      daysToExam: null,
      weakestTopics: [],
      lastMockPct: null,
      rankDeltaWeek: 0,
    });

    expect(nudges.length).toBeGreaterThanOrEqual(1);
  });
});
