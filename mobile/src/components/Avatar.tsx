import type { ImageSourcePropType, ImageStyle, ViewStyle } from 'react-native';
import { PremiumAvatar } from './profile/PremiumAvatar';
import {
  defaultAvatarPresetForName,
  getAvatarPreset,
  type AvatarPresetId,
} from './profile/avatarPresets';

type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name?: string;
  source?: ImageSourcePropType;
  presetId?: AvatarPresetId | null;
  size?: AvatarSize;
  style?: ViewStyle & ImageStyle;
};

const SIZE_MAP: Record<AvatarSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/** App-wide avatar — premium 3D tile; uses stored preset when provided. */
export function Avatar({ name, source, presetId, size = 'md', style }: AvatarProps) {
  const uri = typeof source === 'object' && source && 'uri' in source ? source.uri : undefined;
  const preset = uri
    ? undefined
    : getAvatarPreset(presetId) ?? defaultAvatarPresetForName(name);

  return (
    <PremiumAvatar
      name={name}
      photoUri={uri}
      preset={preset}
      size={SIZE_MAP[size]}
      style={style}
    />
  );
}

export { getAvatarPreset, defaultAvatarPresetForName };
