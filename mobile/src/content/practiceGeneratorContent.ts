/** Common exam subjects for quick-pick chips in the AI test generator. */
export const PRACTICE_SUBJECT_SUGGESTIONS = [
  'General Studies',
  'Quantitative Aptitude',
  'Reasoning',
  'English',
  'General Awareness',
  'Indian Polity',
  'History',
  'Geography',
  'Economics',
  'Science',
] as const;

export const PRACTICE_QUESTION_COUNTS = [5, 8, 10, 12, 15, 20] as const;

export const SECONDS_PER_QUESTION = 90;

export function estimatePracticeDurationMin(count: number): number {
  return Math.max(1, Math.round((count * SECONDS_PER_QUESTION) / 60));
}
