import { NativeModules, Platform } from 'react-native';

export function isLiveKitNativeAvailable(): boolean {
  if (Platform.OS === 'web') {
    return typeof globalThis.RTCPeerConnection !== 'undefined';
  }

  return NativeModules.WebRTCModule != null;
}
