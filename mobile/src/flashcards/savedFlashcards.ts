import { getSecureItem, setSecureItem } from '../lib/secureStorage';

const SAVED_FLASHCARDS_KEY = 'sopaan_saved_flashcards';

export type SavedFlashcard = {
  id: string;
  front: string;
  back: string;
  deckTitle?: string;
  savedAt: string;
};

export async function listSavedFlashcards(): Promise<SavedFlashcard[]> {
  const raw = await getSecureItem(SAVED_FLASHCARDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedFlashcard[];
  } catch {
    return [];
  }
}

export async function saveFlashcardBookmark(
  card: Omit<SavedFlashcard, 'savedAt'> & { savedAt?: string },
): Promise<SavedFlashcard> {
  const existing = await listSavedFlashcards();
  const entry: SavedFlashcard = {
    ...card,
    savedAt: card.savedAt ?? new Date().toISOString(),
  };
  const without = existing.filter((item) => item.id !== card.id);
  await setSecureItem(
    SAVED_FLASHCARDS_KEY,
    JSON.stringify([entry, ...without].slice(0, 100)),
  );
  return entry;
}

export async function removeFlashcardBookmark(id: string): Promise<void> {
  const existing = await listSavedFlashcards();
  await setSecureItem(
    SAVED_FLASHCARDS_KEY,
    JSON.stringify(existing.filter((item) => item.id !== id)),
  );
}
