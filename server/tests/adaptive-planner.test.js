import { describe, expect, it } from '@jest/globals';
import {
  allocateDurations,
  buildFlashcardReason,
  buildSessionSlots,
  buildWeakTopicReason,
  computeExamProximity,
  urgencyMultiplier,
} from '../src/services/planner/adaptivePlanner.js';

describe('adaptive planner', () => {
  it('computes nearest upcoming exam for a track', () => {
    const now = new Date('2026-06-26T12:00:00.000Z');
    const exams = [
      {
        name: 'SSC CGL',
        code: 'SSCCGL',
        category: 'SSC',
        importantDates: [{ type: 'exam', date: new Date('2026-08-10T00:00:00.000Z') }],
      },
    ];

    const proximity = computeExamProximity(exams, 'SSC CGL', now);
    expect(proximity?.examName).toBe('SSC CGL');
    expect(proximity?.daysAway).toBe(45);
  });

  it('builds weak topic reasons from mastery delta', () => {
    expect(buildWeakTopicReason('Time & Work', 'Quant', 1320, 1500)).toContain(
      'Time & Work mastery dropped',
    );
  });

  it('builds flashcard due reason', () => {
    expect(buildFlashcardReason(12)).toBe('12 flashcards due for review today');
  });

  it('allocates durations to the daily goal', () => {
    const durations = allocateDurations(
      [{ weight: 1, minMinutes: 20 }, { weight: 1, minMinutes: 20 }],
      90,
    );
    expect(durations.reduce((sum, value) => sum + value, 0)).toBe(90);
    expect(durations.every((value) => value >= 20)).toBe(true);
  });

  it('builds sessions from weak topics and due flashcards', () => {
    const sessions = buildSessionSlots({
      weakTopics: [
        {
          subject: 'Quant',
          topic: 'Time & Work',
          rating: 1320,
          averageRating: 1500,
        },
      ],
      dueFlashcardCount: 8,
      examProximity: { examName: 'SSC CGL', daysAway: 40, category: 'SSC' },
      dailyGoalMinutes: 90,
    });

    expect(sessions.length).toBeGreaterThanOrEqual(2);
    expect(sessions.some((session) => session.subject === 'Flashcards')).toBe(true);
    expect(sessions.some((session) => session.topic === 'Time & Work')).toBe(true);
    expect(sessions.reduce((sum, session) => sum + session.durationMin, 0)).toBe(90);
    expect(sessions.every((session) => session.reason)).toBe(true);
  });

  it('increases urgency when the exam is soon', () => {
    expect(urgencyMultiplier(10)).toBeGreaterThan(urgencyMultiplier(90));
  });
});
