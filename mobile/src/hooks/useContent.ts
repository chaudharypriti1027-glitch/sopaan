import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBook, listBooks, listSubjects, type LibraryListParams } from '../api/books';
import { revisionCapsulesApi, testSeriesApi, vocabularyApi } from '../api';
import type { PaginationParams } from '../api';
import { useAuth } from '../auth';
import { useLanguage } from '../language/LanguageContext';
import { queryKeys } from './queryKeys';

export function useBooks(params?: LibraryListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.books.list(params),
    queryFn: () => listBooks(params),
    enabled: options?.enabled ?? true,
  });
}

export function useLibrarySubjects() {
  return useQuery({
    queryKey: queryKeys.books.subjects(),
    queryFn: () => listSubjects(),
  });
}

export function useLibraryBook(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.books.detail(id ?? ''),
    queryFn: () => getBook(id!),
    enabled: (options?.enabled ?? true) && Boolean(id),
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
