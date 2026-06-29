import { DEFAULT_MASTERY_RATING } from '../adaptive/rating.js';

export const START_TIMES = ['09:00', '11:30', '14:00', '17:00', '19:30'];

const FLASHCARD_MINUTES_PER_CARD = 2;
const FLASHCARD_SESSION_MAX = 20;
const FLASHCARD_SESSION_MIN = 10;
const TOPIC_SESSION_MIN = 20;

/**
 * Days until the nearest upcoming exam date for the user's track.
 */
export function computeExamProximity(exams, examTrack, now = new Date()) {
  if (!examTrack) {
    return null;
  }

  const track = examTrack.toLowerCase();
  let nearest = null;

  for (const exam of exams) {
    const matchesTrack =
      exam.name?.toLowerCase().includes(track) ||
      exam.code?.toLowerCase().includes(track.replace(/\s+/g, '')) ||
      track.includes(exam.category?.toLowerCase() ?? '');

    if (!matchesTrack) {
      continue;
    }

    for (const item of exam.importantDates ?? []) {
      if (item.type !== 'exam') {
        continue;
      }

      const examDate = new Date(item.date);
      if (examDate < now) {
        continue;
      }

      const daysAway = Math.ceil((examDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (!nearest || daysAway < nearest.daysAway) {
        nearest = {
          examName: exam.name,
          examDate,
          daysAway,
          category: exam.category,
        };
      }
    }
  }

  return nearest;
}

export function urgencyMultiplier(daysAway) {
  if (daysAway == null) {
    return 1;
  }
  if (daysAway <= 14) {
    return 1.35;
  }
  if (daysAway <= 30) {
    return 1.2;
  }
  if (daysAway <= 60) {
    return 1.1;
  }
  return 1;
}

export function buildWeakTopicReason(topic, subject, rating, averageRating) {
  if (rating < averageRating - 40) {
    return `Your ${topic} mastery dropped (${rating} vs avg ${averageRating})`;
  }
  if (rating < DEFAULT_MASTERY_RATING - 80) {
    return `Your ${topic} mastery needs work (${subject})`;
  }
  return `Strengthen ${topic} in ${subject}`;
}

export function buildFlashcardReason(dueCount) {
  return `${dueCount} flashcard${dueCount === 1 ? '' : 's'} due for review today`;
}

export function buildExamReason(examProximity, subject) {
  return `${examProximity.examName} in ${examProximity.daysAway} days — prioritize ${subject}`;
}

/**
 * Allocate minutes across session slots summing to dailyGoalMinutes.
 */
export function allocateDurations(slots, dailyGoalMinutes) {
  if (!slots.length) {
    return [];
  }

  const weights = slots.map((slot) => slot.weight ?? 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let assigned = 0;

  const durations = slots.map((slot, index) => {
    if (index === slots.length - 1) {
      return Math.max(slot.minMinutes ?? TOPIC_SESSION_MIN, dailyGoalMinutes - assigned);
    }

    const raw = Math.round((dailyGoalMinutes * weights[index]) / totalWeight);
    const duration = Math.max(slot.minMinutes ?? TOPIC_SESSION_MIN, raw);
    assigned += duration;
    return duration;
  });

  const total = durations.reduce((sum, value) => sum + value, 0);
  if (total !== dailyGoalMinutes && durations.length) {
    durations[durations.length - 1] += dailyGoalMinutes - total;
  }

  return durations;
}

export function buildSessionSlots({
  weakTopics,
  dueFlashcardCount,
  examProximity,
  dailyGoalMinutes,
}) {
  const slots = [];
  const urgency = urgencyMultiplier(examProximity?.daysAway);

  if (dueFlashcardCount > 0) {
    const flashMinutes = Math.min(
      FLASHCARD_SESSION_MAX,
      Math.max(FLASHCARD_SESSION_MIN, dueFlashcardCount * FLASHCARD_MINUTES_PER_CARD),
    );
    slots.push({
      subject: 'Flashcards',
      topic: 'Spaced review',
      type: 'revision',
      reason: buildFlashcardReason(dueFlashcardCount),
      minMinutes: flashMinutes,
      weight: 0.8,
      fixedMinutes: flashMinutes,
    });
  }

  const topicLimit = examProximity && examProximity.daysAway <= 30 ? 3 : 2;
  const topics = weakTopics.slice(0, topicLimit);

  for (const mastery of topics) {
    const weight = mastery.rating < DEFAULT_MASTERY_RATING ? 1.4 * urgency : 1.1 * urgency;
    slots.push({
      subject: mastery.subject,
      topic: mastery.topic,
      type: 'practice',
      reason: buildWeakTopicReason(
        mastery.topic,
        mastery.subject,
        mastery.rating,
        mastery.averageRating,
      ),
      minMinutes: TOPIC_SESSION_MIN,
      weight,
    });
  }

  if (!topics.length) {
    slots.push({
      subject: 'General',
      topic: 'Mixed practice',
      type: 'study',
      reason: 'Build baseline mastery with a mixed session',
      minMinutes: TOPIC_SESSION_MIN,
      weight: 1,
    });
  }

  if (examProximity && examProximity.daysAway <= 60) {
    const subject = topics[0]?.subject ?? examProximity.category ?? 'General';
    slots.push({
      subject,
      topic: 'Exam sprint',
      type: 'practice',
      reason: buildExamReason(examProximity, subject),
      minMinutes: TOPIC_SESSION_MIN,
      weight: 1.5 * urgency,
    });
  }

  const fixedTotal = slots.reduce((sum, slot) => sum + (slot.fixedMinutes ?? 0), 0);
  const flexibleSlots = slots.filter((slot) => !slot.fixedMinutes);
  const remainingMinutes = Math.max(0, dailyGoalMinutes - fixedTotal);

  const flexibleDurations = allocateDurations(
    flexibleSlots.map((slot) => ({ weight: slot.weight, minMinutes: slot.minMinutes })),
    remainingMinutes || dailyGoalMinutes,
  );

  let flexIndex = 0;
  return slots.map((slot, index) => ({
    startTime: START_TIMES[index] ?? '19:30',
    subject: slot.subject,
    topic: slot.topic,
    type: slot.type,
    reason: slot.reason,
    durationMin: slot.fixedMinutes ?? flexibleDurations[flexIndex++] ?? TOPIC_SESSION_MIN,
    completed: false,
  }));
}

export function averageMasteryRating(masteries) {
  if (!masteries.length) {
    return DEFAULT_MASTERY_RATING;
  }
  return Math.round(masteries.reduce((sum, item) => sum + item.rating, 0) / masteries.length);
}

export function annotateWeakestTopics(masteries) {
  const averageRating = averageMasteryRating(masteries);
  return masteries.map((item) => ({
    ...item,
    averageRating,
  }));
}
