import { createContext, useMemo, type ReactNode } from 'react';
import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';
import type { Theme, ThemeMode } from './types';

export type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  /** Reserved for future dark-mode toggle. */
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const themes: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

type ThemeProviderProps = {
  children: ReactNode;
  /** Defaults to light. Pass `dark` when dark mode is enabled. */
  initialMode?: ThemeMode;
};

export function ThemeProvider({ children, initialMode = 'light' }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[initialMode],
      mode: initialMode,
      setMode: () => {
        // Dark mode toggle will wire here.
      },
    }),
    [initialMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
