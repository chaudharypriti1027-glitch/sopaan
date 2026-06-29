import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  flashcardsApi,
  focusApi,
  physicalApi,
  rewardsApi,
  wellnessApi,
  type CreatePhysicalLogInput,
  type FocusLogInput,
  type SrRating,
 PaginationParams } from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useLogFocus() {
  return useMutation({
    mutationFn: (input: FocusLogInput) => focusApi.logFocus(input),
  });
}

export function usePhysicalStandards(goal?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.physical.standards(goal),
    queryFn: () => physicalApi.getStandards(goal),
    enabled: isAuthenticated,
  });
}

export function usePhysicalFitnessPlan(goal?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.physical.plan(goal),
    queryFn: () => physicalApi.getFitnessPlan(goal),
    enabled: isAuthenticated,
  });
}

export function usePhysicalLogs(params?: PaginationParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.physical.logs(params),
    queryFn: () => physicalApi.listPhysicalLogs(params),
    enabled: isAuthenticated,
  });
}

export function useCreatePhysicalLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePhysicalLogInput) => physicalApi.createPhysicalLog(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.physical.all });
    },
  });
}

export function useRewardsList(params?: PaginationParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.rewards.list(params),
    queryFn: () => rewardsApi.listRewards(params),
    enabled: isAuthenticated,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rewardsApi.redeemReward(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}

export function useBadges() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.badges.list(),
    queryFn: rewardsApi.listBadges,
    enabled: isAuthenticated,
  });
}

export function useWellnessSessions() {
  return useQuery({
    queryKey: queryKeys.wellness.sessions(),
    queryFn: wellnessApi.listWellnessSessions,
  });
}

export function useFlashcardDecks() {
  return useQuery({
    queryKey: queryKeys.flashcards.decks(),
    queryFn: flashcardsApi.listFlashcardDecks,
  });
}

export function useFlashcardsDueCount(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.flashcards.dueCount(),
    queryFn: flashcardsApi.getDueFlashcardCount,
    enabled: isAuthenticated && (options?.enabled ?? true),
  });
}

export function useFlashcardsDue() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.flashcards.due(),
    queryFn: flashcardsApi.getDueFlashcards,
    enabled: isAuthenticated,
  });
}

export function useDeckDueCounts() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.flashcards.deckDueCounts(),
    queryFn: flashcardsApi.getDeckDueCounts,
    enabled: isAuthenticated,
  });
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: flashcardsApi.reviewFlashcard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
    },
  });
}

export type { SrRating };
