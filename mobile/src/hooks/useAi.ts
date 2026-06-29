import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aiApi,
  type AskDoubtInput,
  type EvaluateAnswerInput,
  type ReportAiFeedbackInput,
} from '../api';
import { useAuth } from '../auth';
import { queryKeys } from './queryKeys';

export function useAskDoubt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AskDoubtInput) => aiApi.askDoubt(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ai.doubts() });
    },
  });
}

export function useAiDoubtHistory() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.ai.doubts(),
    queryFn: () => aiApi.listDoubtHistory({ limit: 40 }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useEvaluateAnswer() {
  return useMutation({
    mutationFn: (input: EvaluateAnswerInput) => aiApi.evaluateAnswer(input),
  });
}

export function useReportAiFeedback() {
  return useMutation({
    mutationFn: (input: ReportAiFeedbackInput) => aiApi.reportAiFeedback(input),
  });
}
