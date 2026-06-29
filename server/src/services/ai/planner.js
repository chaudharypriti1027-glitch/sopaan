import { complete } from './claudeClient.js';
import { PLANNER_COPY_RUBRIC } from './prompts/stablePrompts.js';

function fallbackCopy({ examTrack, sessions }) {
  return {
    headline: `${sessions.length} sessions tailored for ${examTrack} today.`,
    sessionMotivations: sessions.map((session) => session.reason),
  };
}

/**
 * Claude writes only the day headline and one motivating line per session.
 * Session structure (subject, topic, duration, reason) is decided in code.
 */
export async function enrichPlanCopy({
  examTrack,
  date,
  language,
  sessions,
  examProximity,
  userId,
}) {
  try {
    const raw = await complete({
      stableSystem: PLANNER_COPY_RUBRIC,
      dynamicSystemSuffix: `Write copy in ${language === 'hi' ? 'Hindi' : 'English'}.`,
      user: JSON.stringify({
        examTrack,
        date,
        examDaysAway: examProximity?.daysAway ?? null,
        sessions: sessions.map((session) => ({
          subject: session.subject,
          topic: session.topic,
          type: session.type,
          durationMin: session.durationMin,
          reason: session.reason,
        })),
      }),
      tier: 'fast',
      feature: 'planner_copy',
      userId,
      maxTokens: 800,
      json: true,
    });

    if (!raw?.headline || !Array.isArray(raw.sessionMotivations)) {
      throw new Error('Invalid planner copy response');
    }

    return {
      headline: raw.headline,
      sessionMotivations: raw.sessionMotivations,
    };
  } catch {
    return fallbackCopy({ examTrack, sessions });
  }
}

/**
 * @deprecated Use buildAdaptiveDayPlan from planner/plannerEngine.js
 */
export async function generateDayPlan(userId, options) {
  const { buildAdaptiveDayPlan } = await import('../planner/plannerEngine.js');
  return buildAdaptiveDayPlan(userId, options);
}
