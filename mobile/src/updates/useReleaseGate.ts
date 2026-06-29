import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { fetchVersionRequirements, type VersionRequirements } from '../api/appConfig';
import { config } from '../config/env';

export type ReleaseGateState =
  | { status: 'checking' }
  | { status: 'force-update'; requirements: VersionRequirements }
  | { status: 'downloading-ota' }
  | { status: 'ready' };

async function applyOtaUpdateIfAvailable(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) {
    return;
  }

  const update = await Updates.checkForUpdateAsync();
  if (!update.isAvailable) {
    return;
  }

  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
}

export function useReleaseGate(): ReleaseGateState {
  const [state, setState] = useState<ReleaseGateState>({ status: 'checking' });

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

        if (Updates.isEnabled) {
          setState({ status: 'downloading-ota' });
          await applyOtaUpdateIfAvailable();
        }

        if (!cancelled) {
          setState({ status: 'ready' });
        }
      } catch {
        // Offline or API unavailable — allow cached app; OTA may apply on next launch.
        if (!cancelled) {
          setState({ status: 'ready' });
        }
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
