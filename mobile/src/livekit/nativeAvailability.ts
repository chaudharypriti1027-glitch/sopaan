import { NativeModules } from 'react-native';

export function isLiveKitNativeAvailable(): boolean {
  return Boolean(NativeModules.WebRTCModule);
}
