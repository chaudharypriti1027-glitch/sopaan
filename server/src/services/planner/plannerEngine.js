import { Exam } from '../../models/Exam.js';
import { User } from '../../models/User.js';
import { TopicMastery } from '../../models/TopicMastery.js';
import { Attempt } from '../../models/Attempt.js';
import { getOrCreateProfile } from '../profileService.js';
import { countDueCards } from '../flashcards/reviewService.js';
import {
  annotateWeakestTopics,
  buildSessionSlots,
  computeExamProximity,
} from './adaptivePlanner.js';
import { enrichPlanCopy } from '../ai/planner.js';

async function loadWeakestTopics(userId) {
  const masteries = await TopicMastery.find({ userId }).sort({ rating: 1 }).limit(5).lean();

  if (masteries.length) {
    return annotateWeakestTopics(masteries);
  }

  const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
  const topicCounts = new Map();

  for (const attempt of attempts) {
    for (const topic of attempt.weakTopics ?? []) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }

  return [...topicCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([topic]) => ({
      subject: 'General',
      topic,
      rating: 1400,
      averageRating: 1500,
    }));
}

function fallbackHeadline(examTrack, sessionCount) {
  return `${sessionCount} focused sessions for ${examTrack} today.`;
}

function fallbackMotivation(session) {
  return session.reason;
}

/**
 * Build today's adaptive plan: code picks sessions, Claude writes copy.
 */
export async function buildAdaptiveDayPlan(userId, { date } = {}) {
  const profileDoc = await getOrCreateProfile(userId);
  const profile = typeof profileDoc.toObject === 'function' ? profileDoc.toObject() : profileDoc;

  const examTrack = profile.goal?.examTrack ?? 'General';
  const dailyGoalMinutes = profile.preferences?.dailyGoalMinutes ?? 90;
  const language = profile.preferences?.language ?? 'en';
  const planDate = date ?? new Date();

  const [weakTopics, dueCards, exams, userDoc] = await Promise.all([
    loadWeakestTopics(userId),
    countDueCards(userId),
    Exam.find({}).select('name code category importantDates').lean(),
    User.findById(userId).select('examDate targetExam').lean(),
  ]);

  let examProximity = computeExamProximity(exams, examTrack, planDate);

  if (userDoc?.examDate) {
    const examDate = new Date(userDoc.examDate);

    if (examDate >= planDate) {
      const daysAway = Math.ceil(
        (examDate.getTime() - planDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      examProximity = {
        examName: userDoc.targetExam?.trim() || examTrack,
        examDate,
        daysAway,
        category: examProximity?.category ?? null,
      };
    }
  }

  const sessions = buildSessionSlots({
    weakTopics,
    dueFlashcardCount: dueCards.count,
    examProximity,
    dailyGoalMinutes,
  });

  let summary = fallbackHeadline(examTrack, sessions.length);
  let enrichedSessions = sessions.map((session) => ({
    ...session,
    motivation: fallbackMotivation(session),
  }));

  try {
    const copy = await enrichPlanCopy({
      examTrack,
      date: planDate.toISOString().slice(0, 10),
      language,
      sessions,
      examProximity,
      userId,
    });

    summary = copy.headline ?? summary;
    enrichedSessions = sessions.map((session, index) => ({
      ...session,
      motivation: copy.sessionMotivations[index] ?? fallbackMotivation(session),
    }));
  } catch {
    // Keep deterministic fallbacks when Claude is unavailable.
  }

  const caDigestSession = {
    startTime: '08:00',
    subject: 'Current Affairs',
    topic: 'Today\'s digest',
    type: 'study',
    reason: 'Read today\'s headlines and memorize one-liners for GK',
    durationMin: 20,
    completed: false,
    actionType: 'ca_digest',
    actionResourceId: '',
  };

  const gameSession = {
    startTime: '20:30',
    subject: 'Brain break',
    topic: 'Affairs quiz game',
    type: 'practice',
    reason: 'Lock in today\'s current affairs with unique MCQs',
    durationMin: 15,
    completed: false,
    actionType: 'game',
    actionResourceId: 'rapid-fire',
  };

  return {
    summary,
    sessions: [caDigestSession, ...enrichedSessions, gameSession],
    meta: {
      dueFlashcards: dueCards.count,
      examProximity,
      dailyGoalMinutes,
    },
  };
}
