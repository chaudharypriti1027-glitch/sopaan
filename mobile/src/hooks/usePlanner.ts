import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plannerApi } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function usePlannerSessions(date: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.planner.sessions({ date }),
    queryFn: () => plannerApi.listPlannerSessions({ date }),
    enabled: isAuthenticated && Boolean(date),
  });
}

export function useCreatePlannerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof plannerApi.createPlannerSession>[0]) =>
      plannerApi.createPlannerSession(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.planner.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.examPlan.all });
    },
  });
}

export function useUpdatePlannerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof plannerApi.updatePlannerSession>[1];
    }) => plannerApi.updatePlannerSession(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.planner.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.examPlan.all });
    },
  });
}

export function useGenerateDayPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: { date?: string }) => plannerApi.generateDayPlan(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.planner.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.examPlan.all });
    },
  });
}

export function useTodayPlanner() {
  const date = todayDateString();
  const sessionsQuery = usePlannerSessions(date);
  const generatePlan = useGenerateDayPlan();
  const hasTriggeredGenerate = useRef(false);

  useEffect(() => {
    if (
      sessionsQuery.isSuccess &&
      sessionsQuery.data.items.length === 0 &&
      !hasTriggeredGenerate.current &&
      !generatePlan.isPending
    ) {
      hasTriggeredGenerate.current = true;
      generatePlan.mutate({ date });
    }
  }, [sessionsQuery.isSuccess, sessionsQuery.data, generatePlan, date]);

  const sessions = useMemo(() => {
    if (generatePlan.data?.sessions?.length) {
      return generatePlan.data.sessions;
    }
    return sessionsQuery.data?.items ?? [];
  }, [generatePlan.data, sessionsQuery.data]);

  const summary =
    generatePlan.data?.summary ??
    (sessions.length
      ? `You have ${sessions.length} sessions planned for today.`
      : 'Generating your AI study plan…');

  const completedCount = sessions.filter((s) => s.completed).length;
  const progress = sessions.length ? completedCount / sessions.length : 0;

  return {
    date,
    sessions,
    summary,
    progress,
    completedCount,
    isLoading: sessionsQuery.isLoading || generatePlan.isPending,
    isError: sessionsQuery.isError || generatePlan.isError,
    refetch: sessionsQuery.refetch,
  };
}
