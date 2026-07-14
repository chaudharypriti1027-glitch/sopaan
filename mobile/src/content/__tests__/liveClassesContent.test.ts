import {
  DEFAULT_LIVE_EXAM_TAG,
  LIVE_DATE_LOCALE,
  LIVE_REACTION_EMOJIS,
  LIVE_REMINDER_MINUTES_BEFORE,
  formatLiveClassWhen,
  formatLiveClassWhenLong,
} from '../liveClassesContent';

describe('liveClassesContent', () => {
  it('exposes shared live defaults', () => {
    expect(LIVE_REMINDER_MINUTES_BEFORE).toBe(15);
    expect(DEFAULT_LIVE_EXAM_TAG).toBe('SSC-CGL');
    expect(LIVE_REACTION_EMOJIS).toEqual(['👍', '🔥', '👏']);
    expect(LIVE_DATE_LOCALE).toBe('en-IN');
  });

  it('formats schedule timestamps', () => {
    const iso = '2026-07-10T15:30:00.000Z';
    expect(formatLiveClassWhen(iso)).toMatch(/\d/);
    expect(formatLiveClassWhenLong(iso)).toMatch(/\d/);
    expect(formatLiveClassWhen()).toBe('');
    expect(formatLiveClassWhenLong(undefined)).toBe('');
  });
});
