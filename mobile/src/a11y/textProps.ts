import { MAX_FONT_SIZE_MULTIPLIER, MAX_FONT_SIZE_MULTIPLIER_DENSE } from './constants';

/** Default Text props — allow system font scaling with a sensible cap. */
export const scalableTextProps = {
  allowFontScaling: true,
  maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
} as const;

export const denseTextProps = {
  allowFontScaling: true,
  maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER_DENSE,
} as const;
