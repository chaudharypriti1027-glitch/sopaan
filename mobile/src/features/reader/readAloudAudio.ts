import * as Speech from 'expo-speech';

/** Configure audio so read-aloud can continue with the screen locked (iOS). */
export async function configureReadAloudAudioSession() {
  // expo-speech uses AVSpeechSynthesizer; UIBackgroundModes audio in app.json enables lock-screen playback on iOS.
}

export function stopAllSpeech() {
  Speech.stop();
}
