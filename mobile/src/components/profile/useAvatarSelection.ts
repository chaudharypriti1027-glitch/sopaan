import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AvatarPresetId } from './avatarPresets';
import { resolveAvatarDisplay, type AvatarDisplay } from './avatarDisplay';
import { clearAvatarPreset, loadAvatarPreset, saveAvatarPreset } from './avatarStorage';

type UseAvatarSelectionInput = {
  userId?: string;
  name?: string;
  avatarUrl?: string | null;
};

/** Loads stored preset + resolves photo / person / badge display — shared by Profile & Home. */
export function useAvatarSelection({ userId, name, avatarUrl }: UseAvatarSelectionInput) {
  const [presetId, setPresetId] = useState<AvatarPresetId | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setPresetId(null);
      return;
    }

    void loadAvatarPreset(userId).then((stored) => {
      if (!cancelled) {
        setPresetId(stored);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const display = useMemo(
    () => resolveAvatarDisplay({ name, avatarUrl, presetId }),
    [name, avatarUrl, presetId],
  );

  const applyPreset = useCallback(
    async (id: AvatarPresetId) => {
      if (!userId) return;
      await saveAvatarPreset(userId, id);
      setPresetId(id);
    },
    [userId],
  );

  const clearPreset = useCallback(async () => {
    if (!userId) return;
    await clearAvatarPreset(userId);
    setPresetId(null);
  }, [userId]);

  return { display, presetId, applyPreset, clearPreset };
}

export type { AvatarDisplay };
