import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

function isLandscapeOrientation(orientation: ScreenOrientation.Orientation) {
  return (
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
  );
}

function readLandscapeFromWindow() {
  const { width, height } = Dimensions.get('window');
  return width > height;
}

/** True when the device is in landscape (updates on rotation). */
export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(readLandscapeFromWindow);

  useEffect(() => {
    const dimensionSub = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    let orientationSub: ScreenOrientation.Subscription | null = null;

    try {
      orientationSub = ScreenOrientation.addOrientationChangeListener((event) => {
        setIsLandscape(isLandscapeOrientation(event.orientationInfo.orientation));
      });
    } catch {
      // Web / simulator may not support orientation APIs.
    }

    void ScreenOrientation.getOrientationAsync()
      .then((info) => setIsLandscape(isLandscapeOrientation(info)))
      .catch(() => {
        setIsLandscape(readLandscapeFromWindow());
      });

    return () => {
      dimensionSub.remove();
      orientationSub?.remove();
    };
  }, []);

  return isLandscape;
}
