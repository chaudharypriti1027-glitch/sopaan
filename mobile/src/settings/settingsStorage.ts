import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'sopaan_settings';

export type AppSettings = {
  focusSounds: boolean;
  pushNotifications: boolean;
};

const DEFAULTS: AppSettings = {
  focusSounds: true,
  pushNotifications: true,
};

export async function loadSettings(): Promise<AppSettings> {
  const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
  if (!raw) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
