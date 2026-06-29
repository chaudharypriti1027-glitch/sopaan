import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import type { Theme } from './types';

export function buildNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: theme.mode === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.brand.primary,
      background: theme.colors.background.primary,
      card: theme.colors.surface.default,
      text: theme.colors.text.primary,
      border: theme.colors.border.default,
      notification: theme.colors.semantic.error,
    },
  };
}
