import * as SecureStore from 'expo-secure-store';

const REMINDERS_KEY = 'sopaan_calendar_reminders';

function reminderKey(examId: string, date: string): string {
  return `${examId}:${date}`;
}

export async function listReminderKeys(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(REMINDERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function hasReminder(examId: string, date: string): Promise<boolean> {
  const keys = await listReminderKeys();
  return keys.includes(reminderKey(examId, date));
}

export async function toggleReminder(examId: string, date: string): Promise<boolean> {
  const key = reminderKey(examId, date);
  const keys = await listReminderKeys();
  const exists = keys.includes(key);
  const next = exists ? keys.filter((item) => item !== key) : [...keys, key];
  await SecureStore.setItemAsync(REMINDERS_KEY, JSON.stringify(next));
  return !exists;
}
