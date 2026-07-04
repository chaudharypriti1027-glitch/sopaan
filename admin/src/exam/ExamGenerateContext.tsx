import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_GENERATE_EXAM, generateExam } from '../api/tests';
import type { GenerateExamPayload } from '../api/testTypes';
import { useToast } from '../components/Toast';

interface ExamGenerateContextValue {
  generating: boolean;
  generateFullExam: (payload?: GenerateExamPayload) => void;
}

const ExamGenerateContext = createContext<ExamGenerateContextValue | null>(null);

export function ExamGenerateProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const mutation = useMutation({
    mutationFn: generateExam,
    onMutate: () => setGenerating(true),
    onSettled: () => setGenerating(false),
    onSuccess: (result) => {
      showToast(`Generated ${result.test.title} — queued for review`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'tests', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const generateFullExam = useCallback(
    (payload: GenerateExamPayload = DEFAULT_GENERATE_EXAM) => {
      if (mutation.isPending) return;
      mutation.mutate(payload);
    },
    [mutation],
  );

  const value = useMemo(
    () => ({
      generating: generating || mutation.isPending,
      generateFullExam,
    }),
    [generating, mutation.isPending, generateFullExam],
  );

  return (
    <ExamGenerateContext.Provider value={value}>
      {children}
      {value.generating ? (
        <div className="gen-overlay" role="status" aria-live="polite">
          <div className="gen-card">
            <div className="gen-spinner" aria-hidden />
            <b>Generating full exam · AI</b>
            <p>Claude Sonnet is drafting a multi-section mock. This may take up to a minute.</p>
          </div>
        </div>
      ) : null}
    </ExamGenerateContext.Provider>
  );
}

export function useExamGenerate() {
  const ctx = useContext(ExamGenerateContext);
  if (!ctx) throw new Error('useExamGenerate must be used within ExamGenerateProvider');
  return ctx;
}
