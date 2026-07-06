import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

/** Re-triggers profile entrance animations when the tab/screen gains focus. */
export function useProfileReplay() {
  const isFocused = useIsFocused();
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (isFocused) {
      setReplayKey((current) => current + 1);
    }
  }, [isFocused]);

  return replayKey;
}
