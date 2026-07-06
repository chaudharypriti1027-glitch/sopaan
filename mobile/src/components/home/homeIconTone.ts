/** @deprecated Import tone helpers from `./homeIcons` instead. */
export {
  continueAccentTone,
  featureLinkPremiumTone,
  nudgePremiumTone,
} from './homeIcons';

import { PREMIUM_ICON_TONES } from '../premium/premiumIconTokens';
import type { AINudge } from '../../types/home';
import { nudgePremiumTone } from './homeIcons';

/** Maps legacy FeatureLinkTone to { bg, fg } for Home explore grid. */
export function featureLinkToneColors(tone: import('../../navigation/profileFeatureLinks').FeatureLinkTone) {
  const palette =
    tone === 'primary'
      ? PREMIUM_ICON_TONES.lavender
      : tone === 'teal'
        ? PREMIUM_ICON_TONES.mint
        : tone === 'gold'
          ? PREMIUM_ICON_TONES.gold
          : PREMIUM_ICON_TONES.rose;
  return { bg: palette.bg, fg: palette.fg };
}

/** Card accent + icon tile for nudge rows. */
export function nudgeCardTint(tone: AINudge['tone']) {
  const iconTone = nudgePremiumTone(tone);
  const palette = PREMIUM_ICON_TONES[iconTone];
  return { accent: palette.fg, iconBg: palette.bg, iconFg: palette.fg };
}
