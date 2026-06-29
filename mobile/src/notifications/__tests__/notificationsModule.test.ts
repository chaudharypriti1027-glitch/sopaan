import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { isExpoGoRuntime, isRemotePushSupported } from '../notificationsModule';

jest.mock('expo-constants', () => ({
  appOwnership: 'expo',
  executionEnvironment: 'storeClient',
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

describe('notificationsModule', () => {
  it('detects Expo Go and disables remote push', () => {
    expect(isExpoGoRuntime()).toBe(true);
    expect(isRemotePushSupported()).toBe(false);
  });

  it('allows push in standalone dev builds on device', () => {
    (Constants as { appOwnership: string | null }).appOwnership = null;
    (Constants as { executionEnvironment: string }).executionEnvironment = 'standalone';
    (Device as { isDevice: boolean }).isDevice = true;

    expect(isExpoGoRuntime()).toBe(false);
    expect(isRemotePushSupported()).toBe(true);
  });
});
