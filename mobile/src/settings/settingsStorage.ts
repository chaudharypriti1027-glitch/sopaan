import { getSecureItem, setSecureItem } from '../lib/secureStorage';

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
  const raw = await getSecureItem(SETTINGS_KEY);
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
  await setSecureItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
