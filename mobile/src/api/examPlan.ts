import { apiClient } from './client';
import type { GoalRoadmap, PlannerSession } from './types';

export type ExamPlanGoal = {
  examTrack: string;
  examName: string;
  targetYear: number;
  examDate: string | null;
  dateLabel: string | null;
  daysLeft: number | null;
};

export type ExamPlanExam = {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  eligibility: {
    ageMin?: number;
    ageMax?: number;
    education?: string;
  } | null;
  stages: { name: string; order: number }[];
  importantDates: { label: string; date: string; type: string }[];
  vacancies: number | null;
  cutoffs: { year: number; category: string; marks: number }[];
  recommendedBooks: {
    title: string;
    author?: string;
    subject?: string;
    rating?: number;
    link?: string;
  }[];
};

export type ExamPlanPhase = {
  name: string;
  order: number;
  durationWeeks: number;
  focus: string;
  milestones: string[];
};

export type ExamPlanAdvice = {
  summary: string;
  dreamMessage: string;
  focusAreas: string[];
  weeklyStrategy: string;
  physicalPrep: string[];
  dailyTargetMinutes: number;
};

export type ExamPlanWeekTask = {
  id: string | null;
  subject: string;
  topic: string;
  durationMin: number;
  type: string;
  completed: boolean;
  planned: boolean;
};

export type ExamPlanWeekDay = {
  date: string;
  dayLabel: string;
  isToday: boolean;
  isPast: boolean;
  theme: string;
  targetMinutes: number;
  tasks: ExamPlanWeekTask[];
  completed: number;
  total: number;
  progressPct: number;
};

export type ExamPlanToday = {
  date: string;
  sessions: PlannerSession[];
  completed: number;
  total: number;
  progressPct: number;
};

export type ExamPlanWeekProgress = {
  completed: number;
  total: number;
  progressPct: number;
};

export type ExamPlanPhysicalPrep = {
  hasPhysicalStage: boolean;
  stageNames: string[];
  tips: string[];
};

export type ExamPlanResponse = {
  goal: ExamPlanGoal;
  exam: ExamPlanExam | null;
  roadmap: GoalRoadmap;
  phases: ExamPlanPhase[];
  weeklyPlan: { phase: string; weeklyHours: number; tasks: string[] }[];
  upcomingDates: { label: string; date: string; type: string }[];
  physicalPrep: ExamPlanPhysicalPrep;
  aiAdvice: ExamPlanAdvice;
  today: ExamPlanToday;
  weekProgress: ExamPlanWeekProgress;
  weeklySchedule: ExamPlanWeekDay[];
  weekPlanProgress: ExamPlanWeekProgress;
  generatedAt: string;
};

export async function getExamPlan(): Promise<ExamPlanResponse> {
  const { data } = await apiClient.get<ExamPlanResponse>('/exam-plan');
  return data;
}
