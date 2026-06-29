import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listQuestions,
  listReviewQueue,
  reviewQuestion,
  importQuestionsJson,
  setQuestionStatus,
  deleteQuestion,
  listExams,
  setExamStatus,
  deleteExam,
  listCourses,
  setCourseStatus,
  deleteCourse,
  listCurrentAffairs,
  setCurrentAffairStatus,
  deleteCurrentAffair,
  type AdminContentQuery,
  type ContentStatus,
  type QuestionReviewAction,
} from '../api/adminContent';
import { queryKeys } from './queryKeys';

export function useAdminQuestions(params?: AdminContentQuery) {
  return useQuery({
    queryKey: queryKeys.admin.questions(params),
    queryFn: () => listQuestions(params),
  });
}

export function useAdminReviewQueue(params?: AdminContentQuery) {
  return useQuery({
    queryKey: queryKeys.admin.reviewQueue(params),
    queryFn: () => listReviewQueue(params),
  });
}

export function useReviewQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: QuestionReviewAction & { id: string }) =>
      reviewQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useImportQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questions: Record<string, unknown>[]) => importQuestionsJson(questions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useAdminExams(params?: AdminContentQuery) {
  return useQuery({
    queryKey: queryKeys.admin.exams(params),
    queryFn: () => listExams(params),
  });
}

export function useAdminCourses(params?: AdminContentQuery) {
  return useQuery({
    queryKey: queryKeys.admin.courses(params),
    queryFn: () => listCourses(params),
  });
}

export function useAdminCurrentAffairs(params?: AdminContentQuery) {
  return useQuery({
    queryKey: queryKeys.admin.currentAffairs(params),
    queryFn: () => listCurrentAffairs(params),
  });
}

export function useSetContentStatus(
  resource: 'questions' | 'exams' | 'courses' | 'current-affairs',
) {
  const queryClient = useQueryClient();

  const setters = {
    questions: setQuestionStatus,
    exams: setExamStatus,
    courses: setCourseStatus,
    'current-affairs': setCurrentAffairStatus,
  };

  return useMutation<void, Error, { id: string; status: ContentStatus }>({
    mutationFn: async ({ id, status }) => {
      await setters[resource](id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useDeleteContent(
  resource: 'questions' | 'exams' | 'courses' | 'current-affairs',
) {
  const queryClient = useQueryClient();

  const deleters = {
    questions: deleteQuestion,
    exams: deleteExam,
    courses: deleteCourse,
    'current-affairs': deleteCurrentAffair,
  };

  return useMutation({
    mutationFn: (id: string) => deleters[resource](id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}
