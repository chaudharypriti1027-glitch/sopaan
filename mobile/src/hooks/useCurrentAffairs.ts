import { useQuery } from '@tanstack/react-query';
import { cacheAffair, getCachedAffair } from '../affairs/offlineAffairCache';
import { currentAffairsApi, type ListCurrentAffairsParams } from '../api';
import { useAuth } from '../auth';
import { useLanguage } from '../language/LanguageContext';
import { queryKeys } from './queryKeys';

export function useCurrentAffairs(params?: ListCurrentAffairsParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.currentAffairs.list(params),
    queryFn: () => currentAffairsApi.listCurrentAffairs(params),
    enabled: isAuthenticated,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useCurrentAffair(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.currentAffairs.detail(id ?? ''),
    queryFn: async () => {
      try {
        const affair = await currentAffairsApi.getCurrentAffair(id!);
        await cacheAffair(affair);
        return affair;
      } catch (error) {
        const cached = await getCachedAffair(id!);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCurrentAffairAiSummary(id: string | undefined) {
  const { language } = useLanguage();
  const summaryLanguage = language === 'hi' ? 'hi' : 'en';

  return useQuery({
    queryKey: queryKeys.currentAffairs.aiSummary(id ?? '', summaryLanguage),
    queryFn: () =>
      currentAffairsApi.getAffairAiSummary(id!, { language: summaryLanguage }),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}
