/**
 * "Classic Premium" glass-skin tokens — frosted glass surfaces used to float
 * chrome (nav bar, header buttons, composer bars) over gradient/imagery
 * backgrounds. Pairs an expo-blur BlurView with a tinted wash so the effect
 * stays legible even where native blur quality is weaker (older Android).
 */
export type GlassTone = 'light' | 'dark' | 'gold';

export type GlassPreset = {
  /** expo-blur BlurView tint */
  blurTint: 'light' | 'dark' | 'default';
  /** Extra translucent color wash layered on top of the blur for consistent contrast. */
  wash: string;
  /** Hairline border color that catches the light on a glass edge. */
  border: string;
};

/** Stronger washes on web where native blur is skipped — keeps contrast without BlurView. */
export const GLASS_WEB_WASH: Record<GlassTone, string> = {
  light: 'rgba(255,255,255,0.85)',
  dark: 'rgba(26,31,59,0.55)',
  gold: 'rgba(244,235,216,0.78)',
};

export const GLASS: Record<GlassTone, GlassPreset> = {
  light: {
    blurTint: 'light',
    wash: 'rgba(255,255,255,0.62)',
    border: 'rgba(255,255,255,0.7)',
  },
  dark: {
    blurTint: 'dark',
    wash: 'rgba(26,31,59,0.38)',
    border: 'rgba(255,255,255,0.16)',
  },
  gold: {
    blurTint: 'light',
    wash: 'rgba(244,235,216,0.55)',
    border: 'rgba(234,223,196,0.8)',
  },
} as const;
