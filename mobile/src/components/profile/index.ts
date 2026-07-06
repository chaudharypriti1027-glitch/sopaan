export { PremiumAvatar, type PremiumAvatarSize } from './PremiumAvatar';
export { PersonAvatarArt, type PersonAvatarSpec, type PersonHairStyle } from './PersonAvatarArt';
export { BlinkingEye, useAvatarBlink } from './BlinkingEye';
export { LiveAvatarMotion } from './LiveAvatarMotion';
export { AVATAR_MOTION } from './avatarMotion';
export {
  AVATAR_BADGE_PRESETS,
  AVATAR_PERSON_PRESETS,
  defaultAvatarPresetForName,
  getAvatarPreset,
  type AvatarPreset,
  type AvatarPresetId,
  type AvatarPresetKind,
} from './avatarPresets';
export { resolveAvatarDisplay, avatarDisplayToPremiumProps, type AvatarDisplay } from './avatarDisplay';
export { loadAvatarPreset, saveAvatarPreset, clearAvatarPreset } from './avatarStorage';
export { useAvatarSelection } from './useAvatarSelection';
export { useProfileAvatar, type ProfileAvatarDisplay } from './useProfileAvatar';
export { useHomeAvatar } from './useHomeAvatar';
export { ProfileHeader } from './ProfileHeader';
export { ProfileAvatarPickerSheet } from './ProfileAvatarPickerSheet';
export { PROFILE } from './profileTheme';
