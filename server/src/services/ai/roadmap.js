import { Exam } from '../../models/Exam.js';
import { Attempt } from '../../models/Attempt.js';
import { complete } from './claudeClient.js';
import { ROADMAP_TIPS_RUBRIC } from './prompts/stablePrompts.js';
import { buildExamSearchQuery } from '../roadmapService.js';
import { average } from '../../utils/testHelpers.js';

const DEFAULT_STAGES = [
  { name: 'Eligibility & Application', order: 1 },
  { name: 'Written Examination', order: 2 },
  { name: 'Physical / Skill Test', order: 3 },
  { name: 'Medical Examination', order: 4 },
  { name: 'Final Merit', order: 5 },
];

function resolveStages(exam) {
  if (exam?.stages?.length) {
    return [...exam.stages].sort((a, b) => a.order - b.order);
  }

  return DEFAULT_STAGES;
}

function computeProgress(profile, attempts, stageCount) {
  const completeness = profile.completeness ?? 0;
  const avgAccuracy = average(attempts.map((attempt) => attempt.accuracy ?? 0));
  const attemptBonus = Math.min(20, attempts.length * 4);
  const overallProgress = Math.round(
    Math.min(100, completeness * 0.35 + avgAccuracy * 0.45 + attemptBonus)
  );

  const currentStageIndex = Math.min(
    stageCount - 1,
    Math.floor((overallProgress / 100) * stageCount)
  );

  return { overallProgress, currentStageIndex };
}

function stageStatus(index, currentStageIndex) {
  if (index < currentStageIndex) {
    return 'completed';
  }

  if (index === currentStageIndex) {
    return 'current';
  }

  return 'upcoming';
}

async function fetchStageTips({ examTrack, targetYear, stages, profile, userId }) {
  try {
    const raw = await complete({
      stableSystem: ROADMAP_TIPS_RUBRIC,
      dynamicSystemSuffix: `Provide exactly ${stages.length} stages in order, each with 2-3 concise tips.`,
      user: JSON.stringify({
        examTrack,
        targetYear,
        stages: stages.map((stage) => stage.name),
        profile: {
          education: profile.education,
          category: profile.category,
          state: profile.state,
          attemptNumber: profile.attemptNumber,
        },
      }),
      tier: 'fast',
      feature: 'roadmap_tips',
      userId,
      maxTokens: 2000,
      json: true,
    });

    if (Array.isArray(raw?.stages)) {
      return raw.stages;
    }
  } catch {
    // fallback below
  }

  return stages.map((stage) => ({
    name: stage.name,
    tips: [
      `Prepare systematically for ${stage.name}.`,
      `Align ${stage.name} prep with ${examTrack} syllabus and previous year patterns.`,
    ],
  }));
}

export async function buildRoadmap({ examTrack, targetYear, profile }) {
  const userId = profile.userId;
  const exam = await Exam.findOne(buildExamSearchQuery(examTrack)).lean();
  const stages = resolveStages(exam);
  const attempts = userId
    ? await Attempt.find({ userId }).sort({ createdAt: -1 }).limit(10).lean()
    : [];

  const { overallProgress, currentStageIndex } = computeProgress(profile, attempts, stages.length);
  const tipStages = await fetchStageTips({ examTrack, targetYear, stages, profile, userId });
  const tipsByName = new Map(tipStages.map((item) => [item.name, item.tips ?? []]));

  const orderedStages = stages.map((stage, index) => ({
    name: stage.name,
    order: stage.order,
    status: stageStatus(index, currentStageIndex),
    tips: tipsByName.get(stage.name) ?? [
      `Focus on ${stage.name} requirements for ${examTrack}.`,
    ],
    progress:
      index < currentStageIndex ? 100 : index === currentStageIndex ? overallProgress % 100 || 25 : 0,
  }));

  return {
    examTrack,
    targetYear,
    examId: exam?._id ?? null,
    examName: exam?.name ?? examTrack,
    currentStage: orderedStages[currentStageIndex]?.name ?? orderedStages[0]?.name,
    currentStageIndex,
    overallProgress,
    stages: orderedStages,
    upcomingDates: (exam?.importantDates ?? [])
      .filter((item) => new Date(item.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}
