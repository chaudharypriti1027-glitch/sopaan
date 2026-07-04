import { MENU_TONE_STYLES, PREMIUM_ICON_TONES, type PremiumIconTone } from '../premium/premiumIconTokens';
import type { FeatureLinkTone } from '../../navigation/profileFeatureLinks';
import type { AINudge, ContinueItem } from '../../types/home';

/** Maps explore-grid / profile link tones to shared premium icon palette. */
const FEATURE_LINK_TONE_MAP: Record<FeatureLinkTone, PremiumIconTone> = {
  primary: 'lavender',
  gold: 'gold',
  teal: 'mint',
  coral: 'rose',
};

/** Maps legacy FeatureLinkTone to { bg, fg } for Home explore grid. */
export function featureLinkToneColors(tone: FeatureLinkTone) {
  const key =
    tone === 'primary' ? 'indigo' : tone === 'teal' ? 'teal' : tone === 'gold' ? 'gold' : 'coral';
  const palette = MENU_TONE_STYLES[key];
  return { bg: palette.bg, fg: palette.fg };
}

export function featureLinkPremiumTone(tone: FeatureLinkTone): PremiumIconTone {
  return FEATURE_LINK_TONE_MAP[tone];
}

/** Maps AI nudge tone to premium icon tile color. */
export function nudgePremiumTone(tone: AINudge['tone']): PremiumIconTone {
  switch (tone) {
    case 'urgent':
      return 'rose';
    case 'streak':
      return 'gold';
    case 'opportunity':
      return 'mint';
    case 'info':
    default:
      return 'lavender';
  }
}

/** Card background tint for nudge rows (lighter wash over icon tone). */
export function nudgeCardTint(tone: AINudge['tone']) {
  const iconTone = nudgePremiumTone(tone);
  const palette = PREMIUM_ICON_TONES[iconTone];
  return { bg: palette.bg, fg: palette.fg, ring: palette.ring };
}

/** Maps continue-learning accent to premium icon tile color. */
export function continueAccentTone(accent: ContinueItem['accent']): PremiumIconTone {
  switch (accent) {
    case 'teal':
      return 'mint';
    case 'gold':
      return 'gold';
    case 'coral':
      return 'rose';
    case 'primary':
    default:
      return 'lavender';
  }
}
