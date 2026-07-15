import { apiClient } from './client';
import { withLanguageParams } from './language';
import type { AppLanguage } from '../language/types';
import type { Course, PaginatedResponse, PaginationParams } from './types';

type RawCourse = Course & { _id?: string };

function normalizeCourse(raw: RawCourse): Course {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? '',
    lessonCount: raw.lessonCount ?? raw.lessons?.length,
  };
}

export type CourseProgressInput = {
  lessonId: string;
  completed?: boolean;
};

export type CourseProgress = {
  courseId: string;
  completedLessons: string[];
  lastLessonId?: string;
  progressPercent: number;
  updatedAt?: string;
};

export async function listCourses(
  params?: PaginationParams & { language?: AppLanguage },
): Promise<PaginatedResponse<Course>> {
  const { data } = await apiClient.get<PaginatedResponse<RawCourse>>('/courses', {
    params: withLanguageParams(params),
  });
  return { ...data, items: (data.items ?? []).map(normalizeCourse) };
}

export async function getCourse(
  id: string,
  params?: { language?: AppLanguage },
): Promise<Course> {
  const { data } = await apiClient.get<RawCourse>(`/courses/${id}`, {
    params: withLanguageParams(params),
  });
  const course = normalizeCourse(data);
  return {
    ...course,
    lessons: (data.lessons ?? []).map((lesson) => ({
      ...lesson,
      id: lesson.id ?? (lesson as { _id?: string })._id,
    })),
  };
}

export async function updateCourseProgress(
  courseId: string,
  input: CourseProgressInput,
): Promise<CourseProgress> {
  const { data } = await apiClient.post<CourseProgress>(`/courses/${courseId}/progress`, input);
  return data;
}
