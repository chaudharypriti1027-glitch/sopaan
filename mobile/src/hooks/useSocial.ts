import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  doubtsApi,
  groupsApi,
  leaderboardApi,
  liveClassesApi,
  mentorsApi,
  successStoriesApi,
  testsApi,
  type CreateCommunityTestInput,
  type CreateDoubtInput,
  type CreateGroupInput,
  type ListCommunityTestsParams,
  type PaginationParams,
} from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useDoubts(params?: PaginationParams & { subject?: string }) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.doubts.list(params),
    queryFn: () => doubtsApi.listDoubts(params),
    enabled: isAuthenticated,
  });
}

export function useCreateDoubt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDoubtInput) => doubtsApi.createDoubt(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.doubts.all });
    },
  });
}

export function useVoteDoubt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => doubtsApi.voteDoubt(id, 'post'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.doubts.all });
    },
  });
}

export function useGroups(params?: PaginationParams & { examTag?: string }) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.groups.list(params),
    queryFn: () => groupsApi.listGroups(params),
    enabled: isAuthenticated,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupsApi.createGroup(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupsApi.joinGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useMentors(params?: PaginationParams & { expertise?: string }) {
  return useQuery({
    queryKey: queryKeys.mentors.list(params),
    queryFn: () => mentorsApi.listMentors(params),
  });
}

export function useMentor(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mentors.detail(id ?? ''),
    queryFn: () => mentorsApi.getMentor(id!),
    enabled: Boolean(id),
  });
}

export function useBookMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, slotStart }: { id: string; slotStart: string }) =>
      mentorsApi.bookMentor(id, slotStart),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mentors.all });
    },
  });
}

export function useLiveClasses() {
  return useQuery({
    queryKey: queryKeys.liveClasses.list(),
    queryFn: liveClassesApi.getLiveClasses,
    staleTime: 15_000,
    refetchOnMount: 'always',
    refetchInterval: (query) => (query.state.data?.liveNow ? 10_000 : false),
  });
}

export function useLiveClass(id?: string) {
  return useQuery({
    queryKey: queryKeys.liveClasses.detail(id ?? ''),
    queryFn: () => liveClassesApi.getLiveClass(id!),
    enabled: Boolean(id),
    refetchInterval: 12_000,
  });
}

export function useLiveClassViewerToken(id?: string) {
  return useQuery({
    queryKey: queryKeys.liveClasses.viewerToken(id ?? ''),
    queryFn: () => liveClassesApi.getLiveToken(id!),
    enabled: Boolean(id),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useLiveClassReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? liveClassesApi.setLiveClassReminder(id) : liveClassesApi.removeLiveClassReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.liveClasses.all });
    },
  });
}

export function useLeaderboard(params?: leaderboardApi.LeaderboardQueryParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.leaderboard.list(params),
    queryFn: () => leaderboardApi.getLeaderboard(params),
    enabled: isAuthenticated,
  });
}

export function useSuccessStories() {
  return useQuery({
    queryKey: queryKeys.successStories.list(),
    queryFn: successStoriesApi.listSuccessStories,
  });
}

export function useCreateCommunityTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommunityTestInput) => testsApi.createCommunityTest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tests.community() });
    },
  });
}

export function useCommunityTests(params?: ListCommunityTestsParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.tests.community(params),
    queryFn: () => testsApi.listCommunityTests(params),
    enabled: isAuthenticated,
  });
}
