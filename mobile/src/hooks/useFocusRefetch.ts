import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

/** Run a callback when the screen gains focus (e.g. refetch after admin updates). */
export function useFocusRefetch(onFocus: () => void) {
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useFocusEffect(
    useCallback(() => {
      onFocusRef.current();
    }, []),
  );
}
