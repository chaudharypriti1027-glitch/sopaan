import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

type SimpleSpeechOptions = {
  language?: string;
  rate?: number;
};

/** One-shot speech for AI explanations and short passages. */
export function useSimpleSpeech(defaultOptions?: SimpleSpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, options?: SimpleSpeechOptions) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      if (isSpeaking && utteranceRef.current === trimmed) {
        stop();
        return;
      }

      Speech.stop();
      utteranceRef.current = trimmed;
      setIsSpeaking(true);

      Speech.speak(trimmed, {
        language: options?.language ?? defaultOptions?.language ?? 'en-IN',
        rate: options?.rate ?? defaultOptions?.rate ?? 0.95,
        onDone: () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        },
        onStopped: () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        },
        onError: () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
        },
      });
    },
    [defaultOptions?.language, defaultOptions?.rate, isSpeaking, stop],
  );

  return { speak, stop, isSpeaking };
}
