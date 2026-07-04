import { getSecureItem, setSecureItem } from '../lib/secureStorage';

const NOTES_KEY = 'sopaan_saved_notes';

export type SavedNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export async function listNotes(): Promise<SavedNote[]> {
  const raw = await getSecureItem(NOTES_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SavedNote[];
  } catch {
    return [];
  }
}

export async function saveNote(note: Omit<SavedNote, 'id' | 'createdAt'>): Promise<SavedNote> {
  const existing = await listNotes();
  const entry: SavedNote = {
    id: `note_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...note,
  };

  await setSecureItem(NOTES_KEY, JSON.stringify([entry, ...existing].slice(0, 50)));
  return entry;
}

export async function deleteNote(id: string): Promise<void> {
  const existing = await listNotes();
  await setSecureItem(NOTES_KEY, JSON.stringify(existing.filter((n) => n.id !== id)));
}
