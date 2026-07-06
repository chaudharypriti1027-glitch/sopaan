import type { AvatarPreset, AvatarPresetId } from './avatarPresets';
import { defaultAvatarPresetForName, getAvatarPreset } from './avatarPresets';

export type AvatarDisplay =
  | { kind: 'photo'; uri: string }
  | { kind: 'preset'; preset: AvatarPreset }
  | { kind: 'initials'; name: string };

export function resolveAvatarDisplay(input: {
  name?: string;
  avatarUrl?: string | null;
  presetId?: AvatarPresetId | null;
}): AvatarDisplay {
  const photo = input.avatarUrl?.trim();
  if (photo) {
    return { kind: 'photo', uri: photo };
  }

  const preset = getAvatarPreset(input.presetId) ?? defaultAvatarPresetForName(input.name);
  if (input.presetId || input.name?.trim()) {
    return { kind: 'preset', preset };
  }

  return { kind: 'initials', name: input.name ?? '' };
}

export function avatarDisplayToPremiumProps(display: AvatarDisplay, name?: string) {
  if (display.kind === 'photo') {
    return { photoUri: display.uri, preset: undefined as undefined };
  }
  if (display.kind === 'preset') {
    return { photoUri: undefined, preset: display.preset };
  }
  return { photoUri: undefined, preset: undefined as undefined, name: name ?? display.name };
}
