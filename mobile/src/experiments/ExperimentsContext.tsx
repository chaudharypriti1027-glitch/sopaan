import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchExperiments,
  trackExperimentEvent as trackExperimentEventApi,
  type ExperimentEventName,
  type ExperimentsResponse,
} from '../api/experiments';
import { getOrCreateInstallId } from '../referrals/referralStorage';
import {
  buildDefaultExperiments,
  loadCachedExperiments,
  saveCachedExperiments,
  type CachedExperiments,
} from './experimentStorage';

type ExperimentsContextValue = {
  assignments: ExperimentsResponse['assignments'];
  payloads: ExperimentsResponse['payloads'];
  installId: string | null;
  isDefault: boolean;
  isReady: boolean;
  refreshExperiments: () => Promise<void>;
  trackEvent: (event: ExperimentEventName, metadata?: Record<string, unknown>) => Promise<void>;
};

const ExperimentsContext = createContext<ExperimentsContextValue | null>(null);

type ExperimentsProviderProps = {
  children: ReactNode;
};

export function ExperimentsProvider({ children }: ExperimentsProviderProps) {
  const [state, setState] = useState<CachedExperiments | null>(null);
  const [isReady, setIsReady] = useState(false);

  const hydrate = useCallback(async () => {
    const cached = await loadCachedExperiments();
    if (cached) {
      setState(cached);
    }

    try {
      const installId = await getOrCreateInstallId();
      const remote = await fetchExperiments(installId);
      const next = await saveCachedExperiments(remote);
      setState(next);
    } catch {
      if (!cached) {
        const installId = await getOrCreateInstallId();
        setState(buildDefaultExperiments(installId));
      }
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const refreshExperiments = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  const trackEvent = useCallback(
    async (event: ExperimentEventName, metadata?: Record<string, unknown>) => {
      const installId = state?.installId ?? (await getOrCreateInstallId());
      if (!installId) {
        return;
      }

      try {
        await trackExperimentEventApi({ installId, event, metadata });
      } catch {
        // non-blocking telemetry
      }
    },
    [state?.installId],
  );

  const value = useMemo<ExperimentsContextValue>(() => {
    const fallback = buildDefaultExperiments('local_default');

    return {
      assignments: state?.assignments ?? fallback.assignments,
      payloads: state?.payloads ?? fallback.payloads,
      installId: state?.installId ?? null,
      isDefault: state?.isDefault ?? true,
      isReady,
      refreshExperiments,
      trackEvent,
    };
  }, [state, isReady, refreshExperiments, trackEvent]);

  return <ExperimentsContext.Provider value={value}>{children}</ExperimentsContext.Provider>;
}

export function useExperiments(): ExperimentsContextValue {
  const context = useContext(ExperimentsContext);
  if (!context) {
    throw new Error('useExperiments must be used within an ExperimentsProvider');
  }
  return context;
}
