import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_PREFIX = 'sopaan_gift_pro_seen_v2:';

export function giftProCelebrationKey(entitlementId: string, giftGrantedAt: string): string {
  return `${entitlementId}:${giftGrantedAt}`;
}

export async function hasSeenGiftProCelebration(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${SEEN_PREFIX}${key}`);
    return value === '1';
  } catch {
    return false;
  }
}

export async function markGiftProCelebrationSeen(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SEEN_PREFIX}${key}`, '1');
  } catch {
    // Best-effort; dialog may reappear once if storage fails.
  }
}
