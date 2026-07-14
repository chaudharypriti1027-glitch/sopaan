import { useQuery } from '@tanstack/react-query';
import { getAffairQuizGame, getAffairStudyPack, getTodayDailyRoutine } from '../api/dailyRoutine';
import { queryKeys } from './queryKeys';

export function useDailyRoutine() {
  return useQuery({
    queryKey: queryKeys.dailyRoutine.today(),
    queryFn: getTodayDailyRoutine,
  });
}

export function useAffairStudyPack(affairId?: string) {
  return useQuery({
    queryKey: queryKeys.currentAffairs.studyPack(affairId ?? ''),
    queryFn: () => getAffairStudyPack(affairId!),
    enabled: Boolean(affairId),
  });
}

export function useAffairQuizGame(affairId?: string) {
  return useQuery({
    queryKey: queryKeys.currentAffairs.quizGame(affairId ?? ''),
    queryFn: () => getAffairQuizGame(affairId!),
    enabled: Boolean(affairId),
  });
}
