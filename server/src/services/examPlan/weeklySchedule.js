import { toIstDateKey } from '../../utils/date.js';
import { endOfDay, startOfDay } from '../../utils/pagination.js';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEKLY_ROTATION = [
  {
    theme: 'Foundation & notes',
    tasks: [
      { subject: 'Core syllabus', topic: 'Concept reading', durationMin: 45, type: 'study' },
      { subject: 'Revision', topic: 'Short notes', durationMin: 30, type: 'revision' },
    ],
  },
  {
    theme: 'PYQ & practice',
    tasks: [
      { subject: 'Previous year', topic: 'Timed questions', durationMin: 50, type: 'practice' },
      { subject: 'Error log', topic: 'Fix mistakes', durationMin: 25, type: 'revision' },
    ],
  },
  {
    theme: 'Weak topics',
    tasks: [
      { subject: 'Weak areas', topic: 'Targeted drill', durationMin: 45, type: 'study' },
      { subject: 'Flashcards', topic: 'Spaced revision', durationMin: 20, type: 'revision' },
    ],
  },
  {
    theme: 'Sectional mock',
    tasks: [
      { subject: 'Sectional test', topic: 'Timed mock', durationMin: 60, type: 'mock' },
      { subject: 'Analysis', topic: 'Review answers', durationMin: 30, type: 'revision' },
    ],
  },
  {
    theme: 'GK & current affairs',
    tasks: [
      { subject: 'Current affairs', topic: 'Daily digest', durationMin: 30, type: 'study' },
      { subject: 'General knowledge', topic: 'Quick quiz', durationMin: 30, type: 'practice' },
    ],
  },
  {
    theme: 'Full revision',
    tasks: [
      { subject: 'Mixed revision', topic: 'All subjects', durationMin: 55, type: 'revision' },
      { subject: 'Formula sheet', topic: 'Quick recap', durationMin: 25, type: 'study' },
    ],
  },
  {
    theme: 'Mock + recovery',
    tasks: [
      { subject: 'Full mock', topic: 'Exam simulation', durationMin: 90, type: 'mock' },
      { subject: 'Wellness', topic: 'Light review only', durationMin: 20, type: 'revision' },
    ],
  },
];

function startOfWeekMonday(date = new Date()) {
  const key = toIstDateKey(date);
  const base = startOfDay(key);
  const dayIndex = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - dayIndex);
  return monday;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function scaleTasks(tasks, dailyGoalMinutes) {
  const total = tasks.reduce((sum, task) => sum + task.durationMin, 0);
  if (total <= dailyGoalMinutes || total === 0) {
    return tasks;
  }

  const ratio = dailyGoalMinutes / total;
  return tasks.map((task) => ({
    ...task,
    durationMin: Math.max(15, Math.round(task.durationMin * ratio)),
  }));
}

function mapSessionTask(session) {
  return {
    id: String(session._id),
    subject: session.subject,
    topic: session.topic ?? '',
    durationMin: session.durationMin,
    type: session.type,
    completed: session.completed,
    planned: true,
  };
}

function mapSuggestedTask(task, examTrack) {
  return {
    id: null,
    subject: task.subject,
    topic: task.topic.replace('exam', examTrack),
    durationMin: task.durationMin,
    type: task.type,
    completed: false,
    planned: false,
  };
}

/**
 * Build Mon–Sun schedule with planner sessions or AI-suggested defaults.
 */
export function buildWeeklySchedule({
  examTrack,
  dailyGoalMinutes = 90,
  daysLeft = null,
  currentPhaseName = 'Foundation',
  physicalPrep,
  sessions = [],
  now = new Date(),
}) {
  const todayKey = toIstDateKey(now);
  const monday = startOfWeekMonday(now);
  const urgency = daysLeft != null && daysLeft <= 30;

  const sessionsByDate = new Map();
  for (const session of sessions) {
    const key = toIstDateKey(session.date);
    const list = sessionsByDate.get(key) ?? [];
    list.push(session);
    sessionsByDate.set(key, list);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    const dateKey = toIstDateKey(date);
    const daySessions = sessionsByDate.get(dateKey) ?? [];
    const rotation = WEEKLY_ROTATION[index];
    let theme = rotation.theme;

    if (urgency && index >= 5) {
      theme = 'Exam-week mocks & revision';
    } else if (currentPhaseName?.toLowerCase().includes('practice')) {
      theme = index % 2 === 0 ? 'Practice & PYQ' : rotation.theme;
    } else if (currentPhaseName?.toLowerCase().includes('revision')) {
      theme = 'Revision & mocks';
    }

    const tasks =
      daySessions.length > 0
        ? daySessions
            .sort((left, right) =>
              String(left.startTime ?? '').localeCompare(String(right.startTime ?? '')),
            )
            .map(mapSessionTask)
        : scaleTasks(rotation.tasks, dailyGoalMinutes).map((task) =>
            mapSuggestedTask(task, examTrack),
          );

    if (physicalPrep?.hasPhysicalStage && (index === 2 || index === 5)) {
      tasks.push({
        id: null,
        subject: 'Physical fitness',
        topic: physicalPrep.stageNames[0] ?? 'PET/PST drills',
        durationMin: 30,
        type: 'physical',
        completed: false,
        planned: false,
      });
    }

    const completed = tasks.filter((task) => task.completed).length;
    const total = tasks.length;
    const targetMinutes = tasks.reduce((sum, task) => sum + task.durationMin, 0);

    return {
      date: dateKey,
      dayLabel: DAY_LABELS[index],
      isToday: dateKey === todayKey,
      isPast: endOfDay(dateKey) < startOfDay(todayKey),
      theme,
      targetMinutes,
      tasks,
      completed,
      total,
      progressPct: total ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export async function loadWeekSessions(userId, now = new Date()) {
  const monday = startOfWeekMonday(now);
  const sunday = endOfDay(toIstDateKey(addDays(monday, 6)));

  const { PlannerSession } = await import('../../models/PlannerSession.js');

  return PlannerSession.find({
    userId,
    date: { $gte: monday, $lte: sunday },
  })
    .sort({ date: 1, startTime: 1 })
    .lean();
}
