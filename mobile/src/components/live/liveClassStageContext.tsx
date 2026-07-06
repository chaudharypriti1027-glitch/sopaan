import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type LiveClassStageContextValue = {
  videoActive: boolean;
  setVideoActive: (active: boolean) => void;
};

const LiveClassStageContext = createContext<LiveClassStageContextValue | null>(null);

export function LiveClassStageProvider({ children }: { children: ReactNode }) {
  const [videoActive, setVideoActive] = useState(false);
  const value = useMemo(() => ({ videoActive, setVideoActive }), [videoActive]);

  return (
    <LiveClassStageContext.Provider value={value}>{children}</LiveClassStageContext.Provider>
  );
}

export function useLiveClassStage() {
  const ctx = useContext(LiveClassStageContext);
  if (!ctx) {
    return { videoActive: false, setVideoActive: () => {} };
  }
  return ctx;
}

/** Notify the immersive shell when educator camera / screen share is visible. */
export function useReportLiveVideo(active: boolean) {
  const { setVideoActive } = useLiveClassStage();

  useEffect(() => {
    setVideoActive(active);
    return () => setVideoActive(false);
  }, [active, setVideoActive]);
}
