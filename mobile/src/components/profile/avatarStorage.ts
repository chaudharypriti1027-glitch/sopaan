import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AvatarPresetId } from './avatarPresets';

const KEY_PREFIX = 'sopaan_avatar_preset:';

function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export async function loadAvatarPreset(userId: string): Promise<AvatarPresetId | null> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return null;
  return raw as AvatarPresetId;
}

export async function saveAvatarPreset(userId: string, presetId: AvatarPresetId): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), presetId);
}

export async function clearAvatarPreset(userId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(userId));
}
