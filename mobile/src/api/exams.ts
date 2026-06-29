import { apiClient } from './client';
import type { Exam, ExamCalendarEntry, PaginatedResponse, PaginationParams } from './types';

type RawExam = Exam & { _id?: string };

function normalizeExam(raw: RawExam): Exam {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? '',
    stages: raw.stages ?? [],
    importantDates: raw.importantDates ?? [],
    recommendedBooks: raw.recommendedBooks ?? [],
    cutoffs: raw.cutoffs ?? [],
  };
}

type RawCalendarEntry = ExamCalendarEntry & {
  examId?: string | { toString(): string };
};

function normalizeExamId(examId: unknown): string {
  if (typeof examId === 'string') {
    return examId;
  }

  if (examId != null && typeof examId === 'object' && 'toString' in examId) {
    return String(examId);
  }

  return '';
}

function normalizeCalendarEntry(raw: RawCalendarEntry): ExamCalendarEntry {
  return {
    examId: normalizeExamId(raw.examId),
    examName: raw.examName,
    examCode: raw.examCode,
    category: raw.category,
    label: raw.label,
    date: raw.date,
    type: raw.type,
  };
}

export async function listExams(params?: PaginationParams): Promise<PaginatedResponse<Exam>> {
  const { data } = await apiClient.get<PaginatedResponse<RawExam>>('/exams', { params });
  return { ...data, items: data.items.map(normalizeExam) };
}

export async function getExam(id: string): Promise<Exam> {
  const { data } = await apiClient.get<RawExam>(`/exams/${id}`);
  return normalizeExam(data);
}

export async function getExamCalendar(
  params?: PaginationParams,
): Promise<PaginatedResponse<ExamCalendarEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<RawCalendarEntry>>('/exams/calendar', {
    params,
  });
  return { ...data, items: data.items.map(normalizeCalendarEntry) };
}
