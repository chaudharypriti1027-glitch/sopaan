import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveNativeVersion(): string {
  return (
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '0.0.0'
  );
}

function resolveRuntimeVersion(): string {
  const runtime = Constants.expoConfig?.runtimeVersion;
  if (typeof runtime === 'string') {
    return runtime;
  }
  return resolveNativeVersion();
}

export const appVersionInfo = Object.freeze({
  nativeVersion: resolveNativeVersion(),
  runtimeVersion: resolveRuntimeVersion(),
  platform: Platform.OS as 'ios' | 'android' | 'web',
  buildNumber:
    Application.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    null,
});
