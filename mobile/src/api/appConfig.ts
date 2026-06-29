import { apiClient } from './client';
import { config } from '../config/env';

export type VersionRequirements = {
  minNativeVersion: string;
  latestNativeVersion: string;
  updateChannel: string;
  forceUpdate: boolean;
  forceUpdateTitle: string;
  forceUpdateMessage: string;
  storeUrl: string | null;
  platform: 'ios' | 'android' | null;
  clientNativeVersion: string | null;
  checkedAt: string;
};

export async function fetchVersionRequirements(): Promise<VersionRequirements> {
  const { data } = await apiClient.get<VersionRequirements>('/app/version-requirements', {
    params: {
      platform: config.platform,
      nativeVersion: config.nativeVersion,
      runtimeVersion: config.runtimeVersion,
    },
  });
  return data;
}
