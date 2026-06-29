import { useQuery } from '@tanstack/react-query';
import { examsApi, type PaginationParams } from '../api';
import { queryKeys } from './queryKeys';

export function useExams(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.exams.list(params),
    queryFn: () => examsApi.listExams(params),
  });
}

export function useExam(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.exams.detail(id ?? ''),
    queryFn: () => examsApi.getExam(id!),
    enabled: Boolean(id),
  });
}

export function useExamCalendar(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.exams.calendar(params),
    queryFn: () => examsApi.getExamCalendar(params),
  });
}
