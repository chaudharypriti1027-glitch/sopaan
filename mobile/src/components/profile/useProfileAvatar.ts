import { useCallback } from 'react';
import type { Profile } from '../../types/auth';
import type { AvatarPresetId } from './avatarPresets';
import { useAvatarSelection, type AvatarDisplay } from './useAvatarSelection';

export type ProfileAvatarDisplay = AvatarDisplay;

export function useProfileAvatar(profile: Profile | undefined) {
  const { display, presetId, applyPreset, clearPreset } = useAvatarSelection({
    userId: profile?.id,
    name: profile?.name,
    avatarUrl: profile?.avatarUrl,
  });

  const wrappedApply = useCallback(
    async (id: AvatarPresetId) => {
      await applyPreset(id);
    },
    [applyPreset],
  );

  return {
    display,
    presetId,
    applyPreset: wrappedApply,
    clearPreset,
  };
}
