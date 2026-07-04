import { Platform } from 'react-native';

const WEB_GLOBAL_STYLE_ID = 'sopaan-web-global';

/** One-time document styles for Expo web — full-height root, smooth scrolling, focus rings. */
export function bootstrapWebDocument(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(WEB_GLOBAL_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = WEB_GLOBAL_STYLE_ID;
  style.textContent = `
    html, body, #root {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    #root {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      width: 100%;
    }
    body {
      background: #E9EBF3;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overscroll-behavior: none;
    }
    input, textarea, select {
      font-size: 16px;
    }
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(35, 42, 77, 0.25);
      border-radius: 999px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    @media (min-width: 640px) {
      input, textarea, select {
        font-size: inherit;
      }
    }
    [role="button"], [role="tab"], button, a {
      cursor: pointer;
    }
    [aria-disabled="true"], button:disabled {
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}
