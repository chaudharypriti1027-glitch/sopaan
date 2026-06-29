function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function monthsUntilTargetYear(targetYear) {
  const now = new Date();
  const target = new Date(targetYear, 11, 31);
  const diffMs = target.getTime() - now.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

function buildDefaultPhases(examTrack, targetYear) {
  const months = monthsUntilTargetYear(targetYear);

  return [
    {
      name: 'Foundation',
      order: 1,
      durationWeeks: Math.max(4, Math.round(months * 0.35 * 4)),
      focus: `Build core syllabus coverage for ${examTrack}`,
      milestones: ['Complete syllabus overview', 'Finish first subject-wise notes'],
    },
    {
      name: 'Practice',
      order: 2,
      durationWeeks: Math.max(4, Math.round(months * 0.4 * 4)),
      focus: 'Sectional tests and PYQ drills',
      milestones: ['Weekly sectional mocks', 'Maintain an error notebook'],
    },
    {
      name: 'Revision & Mocks',
      order: 3,
      durationWeeks: Math.max(3, Math.round(months * 0.25 * 4)),
      focus: 'Full-length mocks and revision capsules',
      milestones: ['Two full mocks per week', 'Revise weak topics from analytics'],
    },
  ];
}

function buildPhasesFromExam(exam, examTrack, targetYear) {
  if (!exam?.stages?.length) {
    return buildDefaultPhases(examTrack, targetYear);
  }

  const months = monthsUntilTargetYear(targetYear);
  const weeksPerStage = Math.max(2, Math.floor((months * 4) / exam.stages.length));

  return exam.stages
    .sort((a, b) => a.order - b.order)
    .map((stage) => ({
      name: stage.name,
      order: stage.order,
      durationWeeks: weeksPerStage,
      focus: `Prepare for ${stage.name} of ${examTrack}`,
      milestones: [
        `Complete ${stage.name} syllabus`,
        `Attempt stage-specific mocks for ${stage.name}`,
      ],
    }));
}

function buildWeeklyPlan(phases, preferences = {}) {
  const dailyGoalMinutes = preferences.dailyGoalMinutes ?? 60;

  return phases.map((phase) => ({
    phase: phase.name,
    weeklyHours: Math.round((dailyGoalMinutes * 6) / 60),
    tasks: [
      `${phase.focus}`,
      `Target milestones: ${phase.milestones.join('; ')}`,
    ],
  }));
}

export function buildRoadmap({ exam, profile }) {
  const examTrack = profile.goal?.examTrack;
  const targetYear = profile.goal?.targetYear ?? profile.targetYear ?? new Date().getFullYear() + 1;

  const phases = buildPhasesFromExam(exam, examTrack, targetYear);

  return {
    examTrack,
    targetYear,
    examId: exam?._id ?? null,
    examName: exam?.name ?? examTrack,
    generatedAt: new Date().toISOString(),
    phases,
    weeklyPlan: buildWeeklyPlan(phases, profile.preferences),
    upcomingDates: (exam?.importantDates ?? [])
      .filter((item) => new Date(item.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
  };
}

export function buildExamSearchQuery(examTrack) {
  const escaped = escapeRegex(examTrack.trim());
  const codeCandidate = examTrack.trim().replace(/\s+/g, '-').toUpperCase();

  return {
    $or: [
      { name: { $regex: new RegExp(escaped, 'i') } },
      { code: codeCandidate },
      { category: { $regex: new RegExp(escaped, 'i') } },
    ],
  };
}
