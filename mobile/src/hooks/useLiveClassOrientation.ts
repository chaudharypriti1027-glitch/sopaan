import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

/** Unlock rotation while in the live class viewer; restore portrait on leave. */
export function useLiveClassOrientation(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await ScreenOrientation.unlockAsync();
      } catch {
        // Simulator or web may not support orientation APIs.
      }
    })();

    return () => {
      if (cancelled) return;
      cancelled = true;
      void (async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch {
          // ignore
        }
      })();
    };
  }, [enabled]);
}
