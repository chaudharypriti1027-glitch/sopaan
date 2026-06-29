import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi, type PaginationParams } from '../api';
import { useLanguage } from '../language/LanguageContext';
import { queryKeys } from './queryKeys';

export function useCourses(params?: PaginationParams) {
  const { language } = useLanguage();
  const queryParams = { ...params, language };

  return useQuery({
    queryKey: queryKeys.courses.list(queryParams),
    queryFn: () => coursesApi.listCourses(queryParams),
  });
}

export function useCourse(id: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: queryKeys.courses.detail(id ?? '', language),
    queryFn: () => coursesApi.getCourse(id!, { language }),
    enabled: Boolean(id),
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
    }: {
      courseId: string;
      lessonId: string;
    }) => coursesApi.updateCourseProgress(courseId, { lessonId, completed: true }),
    onSuccess: (_data, { courseId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}

export function useUpdateCourseProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      completed,
    }: {
      courseId: string;
      lessonId: string;
      completed: boolean;
    }) => coursesApi.updateCourseProgress(courseId, { lessonId, completed }),
    onSuccess: (_data, { courseId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}
