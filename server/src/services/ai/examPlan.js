import { complete } from './claudeClient.js';
import { EXAM_PLAN_RUBRIC } from './prompts/stablePrompts.js';

function fallbackAdvice({ examTrack, daysLeft, todayProgress, physicalPrep }) {
  const focusAreas = [
    `Cover weak topics for ${examTrack} with timed practice.`,
    'Revise notes and attempt a sectional mock.',
  ];

  if (physicalPrep?.hasPhysicalStage) {
    focusAreas.push('Include daily physical fitness drills alongside written prep.');
  }

  return {
    summary: daysLeft != null
      ? `${daysLeft} days to ${examTrack}. Stay consistent with today's ${todayProgress.total} planned sessions.`
      : `Build momentum for ${examTrack} with focused daily sessions.`,
    dreamMessage: `Cracking ${examTrack} is built one focused week at a time — start today.`,
    focusAreas,
    weeklyStrategy: 'Alternate concept revision with mocks and error analysis.',
    physicalPrep: physicalPrep?.hasPhysicalStage
      ? physicalPrep.tips
      : [],
    dailyTargetMinutes: 90,
  };
}

/**
 * AI coaching summary for the full exam plan view.
 */
export async function buildExamPlanAdvice({
  examTrack,
  targetYear,
  exam,
  roadmap,
  todayProgress,
  weekProgress,
  physicalPrep,
  language = 'en',
  userId,
}) {
  const base = fallbackAdvice({
    examTrack,
    daysLeft: roadmap?.daysLeft ?? null,
    todayProgress,
    physicalPrep,
  });

  try {
    const raw = await complete({
      stableSystem: EXAM_PLAN_RUBRIC,
      dynamicSystemSuffix: `Write in ${language === 'hi' ? 'Hindi' : 'English'}.`,
      user: JSON.stringify({
        examTrack,
        targetYear,
        examCategory: exam?.category ?? null,
        stages: exam?.stages?.map((stage) => stage.name) ?? [],
        daysLeft: roadmap?.daysLeft ?? null,
        overallProgress: roadmap?.overallProgress ?? 0,
        currentStage: roadmap?.currentStage ?? null,
        todayCompleted: todayProgress.completed,
        todayTotal: todayProgress.total,
        weekCompleted: weekProgress.completed,
        weekTotal: weekProgress.total,
        hasPhysicalStage: physicalPrep?.hasPhysicalStage ?? false,
      }),
      tier: 'fast',
      feature: 'exam_plan',
      userId,
      maxTokens: 900,
      json: true,
    });

    if (!raw?.summary || !Array.isArray(raw.focusAreas)) {
      throw new Error('Invalid exam plan advice response');
    }

    return {
      summary: raw.summary,
      dreamMessage: raw.dreamMessage ?? base.dreamMessage,
      focusAreas: raw.focusAreas.slice(0, 5),
      weeklyStrategy: raw.weeklyStrategy ?? base.weeklyStrategy,
      physicalPrep: Array.isArray(raw.physicalPrep)
        ? raw.physicalPrep
        : base.physicalPrep,
      dailyTargetMinutes: raw.dailyTargetMinutes ?? base.dailyTargetMinutes,
    };
  } catch {
    return base;
  }
}
