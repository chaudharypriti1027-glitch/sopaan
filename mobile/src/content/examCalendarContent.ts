import type { ExamCalendarEntry } from '../api/types';

export type ExamCalendarGroup = 'openJobs' | 'upcoming' | 'results' | 'other';

export const EXAM_CALENDAR_GROUP_ORDER: ExamCalendarGroup[] = [
  'openJobs',
  'upcoming',
  'results',
  'other',
];

export const EXAM_CALENDAR_GROUP_LABEL_KEYS: Record<ExamCalendarGroup, string> = {
  openJobs: 'examCalendar.openJobs',
  upcoming: 'examCalendar.upcoming',
  results: 'examCalendar.results',
  other: 'examCalendar.other',
};

export function mapExamCalendarGroup(type: ExamCalendarEntry['type']): ExamCalendarGroup {
  if (type === 'open' || type === 'apply') return 'openJobs';
  if (type === 'result') return 'results';
  if (type === 'other') return 'other';
  return 'upcoming';
}
