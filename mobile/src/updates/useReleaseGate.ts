import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { fetchVersionRequirements, type VersionRequirements } from '../api/appConfig';
import { config } from '../config/env';

export type ReleaseGateState =
  | { status: 'ready' }
  | { status: 'force-update'; requirements: VersionRequirements };

async function prefetchOtaUpdateInBackground(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) {
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
    }
  } catch {
    // OTA is best-effort; apply on next cold start when fetch succeeds.
  }
}

export function useReleaseGate(): ReleaseGateState {
  const [state, setState] = useState<ReleaseGateState>({ status: 'ready' });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const requirements = await fetchVersionRequirements();

        if (cancelled) {
          return;
        }

        if (requirements.forceUpdate) {
          setState({ status: 'force-update', requirements });
          return;
        }
      } catch {
        // Offline or cold API — continue with cached build; recheck next launch.
      }

      if (!cancelled) {
        void prefetchOtaUpdateInBackground();
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function getReleaseMetadata() {
  return {
    nativeVersion: config.nativeVersion,
    runtimeVersion: config.runtimeVersion,
    platform: config.platform,
    updateChannel: Updates.channel ?? null,
    updateId: Updates.updateId ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
