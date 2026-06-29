import { describe, expect, it } from '@jest/globals';
import { buildCountdownFromGoal } from '../src/services/home/getCountdown.js';
import { startOfIstDay } from '../src/utils/date.js';

describe('getCountdown', () => {
  it('returns null when goal has no examDate', () => {
    expect(buildCountdownFromGoal({ examName: 'SSC CGL' })).toBeNull();
    expect(buildCountdownFromGoal(null)).toBeNull();
  });

  it('computes daysLeft and dateLabel from examDate in IST', () => {
    const now = new Date('2026-06-26T06:00:00.000Z');
    const examDate = new Date(startOfIstDay(now).getTime() + 10 * 24 * 60 * 60 * 1000);

    const countdown = buildCountdownFromGoal(
      { examName: 'SSC CGL', examDate },
      now,
    );

    expect(countdown).toMatchObject({
      examName: 'SSC CGL',
      daysLeft: 10,
      dateLabel: expect.any(String),
    });
  });

  it('clamps daysLeft to zero for past exam dates', () => {
    const now = new Date('2026-06-26T06:00:00.000Z');
    const examDate = new Date(startOfIstDay(now).getTime() - 3 * 24 * 60 * 60 * 1000);

    const countdown = buildCountdownFromGoal(
      { examName: 'UPSC Prelims', examDate },
      now,
    );

    expect(countdown?.daysLeft).toBe(0);
    expect(countdown?.examName).toBe('UPSC Prelims');
  });

  it('defaults examName when missing', () => {
    const now = new Date('2026-06-26T06:00:00.000Z');
    const examDate = new Date(startOfIstDay(now).getTime() + 5 * 24 * 60 * 60 * 1000);

    const countdown = buildCountdownFromGoal({ examDate }, now);

    expect(countdown?.examName).toBe('Your exam');
  });
});
