import { Platform, useWindowDimensions } from 'react-native';

export const WEB_BREAKPOINTS = {
  tablet: 640,
  desktop: 1024,
} as const;

export const WEB_TOP_NAV_HEIGHT = 72;
export const WEB_CONTENT_MAX_WIDTH = 1280;

/** Student web app uses full viewport width (not a phone frame). */
export function getShellMaxWidth(_windowWidth: number): '100%' {
  return '100%';
}

export function getWebContentPadding(windowWidth: number): number {
  if (windowWidth < WEB_BREAKPOINTS.tablet) {
    return 16;
  }
  if (windowWidth < WEB_BREAKPOINTS.desktop) {
    return 24;
  }
  return 32;
}

export function getWebContentMaxWidth(windowWidth: number): number {
  if (windowWidth >= WEB_BREAKPOINTS.desktop) {
    return WEB_CONTENT_MAX_WIDTH;
  }
  if (windowWidth >= WEB_BREAKPOINTS.tablet) {
    return Math.min(windowWidth - 48, 960);
  }
  return windowWidth;
}

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const shellMaxWidth = isWeb ? getShellMaxWidth(width) : undefined;
  const isFramedWeb = false;
  const isWideWeb = isWeb && width >= WEB_BREAKPOINTS.desktop;
  const isTabletWeb = isWeb && width >= WEB_BREAKPOINTS.tablet;
  const contentPadding = isWeb ? getWebContentPadding(width) : undefined;
  const contentMaxWidth = isWeb ? getWebContentMaxWidth(width) : undefined;

  return {
    isWeb,
    width,
    height,
    shellMaxWidth,
    isFramedWeb,
    isWideWeb,
    isTabletWeb,
    contentPadding,
    contentMaxWidth,
    topChromeHeight: isWideWeb ? WEB_TOP_NAV_HEIGHT : 0,
  };
}

export function useWebChromeInsets() {
  const { isWideWeb } = useResponsiveLayout();
  return {
    top: isWideWeb ? WEB_TOP_NAV_HEIGHT : 0,
  };
}
