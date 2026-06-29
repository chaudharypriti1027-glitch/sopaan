import { isLiveKitNativeAvailable } from './nativeAvailability';

let initialized = false;

export { isLiveKitNativeAvailable };

export async function ensureLiveKitReady(): Promise<void> {
  if (initialized) {
    return;
  }

  if (!isLiveKitNativeAvailable()) {
    throw new Error('LIVEKIT_NATIVE_UNAVAILABLE');
  }

  const { registerGlobals } = await import('@livekit/react-native');
  registerGlobals();
  initialized = true;
}
