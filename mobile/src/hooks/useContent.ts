import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi, revisionCapsulesApi, testSeriesApi, vocabularyApi } from '../api';
import type { PaginationParams } from '../api';
import { useAuth } from '../auth';
import { useLanguage } from '../language/LanguageContext';
import { queryKeys } from './queryKeys';

export function useBooks(params?: PaginationParams & { subject?: string; examId?: string }) {
  return useQuery({
    queryKey: queryKeys.books.list(params),
    queryFn: () => booksApi.listBooks(params),
  });
}

export function useRevisionCapsules(params?: PaginationParams & { subject?: string }) {
  const { language } = useLanguage();
  const queryParams = { ...params, language };

  return useQuery({
    queryKey: queryKeys.revisionCapsules.list(queryParams),
    queryFn: () => revisionCapsulesApi.listRevisionCapsules(queryParams),
  });
}

export function useVocabularyToday() {
  return useQuery({
    queryKey: queryKeys.vocabulary.today(),
    queryFn: vocabularyApi.getTodaysVocabulary,
  });
}

export function useVocabularyRecent(limit = 7) {
  return useQuery({
    queryKey: queryKeys.vocabulary.recent(limit),
    queryFn: () => vocabularyApi.listRecentVocabulary(limit),
  });
}

export function useTestSeriesList(params?: PaginationParams & { examTag?: string }) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.testSeries.list(params),
    queryFn: () => testSeriesApi.listTestSeries(params),
    enabled: isAuthenticated,
  });
}

export function useTestSeries(id: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.testSeries.detail(id ?? ''),
    queryFn: () => testSeriesApi.getTestSeries(id!),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useEnrollTestSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testSeriesApi.enrollTestSeries(id),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.testSeries.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.testSeries.all });
    },
  });
}
