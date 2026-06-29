import { apiClient } from './client';

export type FlashcardItem = {
  id: string;
  front: string;
  back: string;
  source?: string;
};

export type FlashcardDeck = {
  id: string;
  title: string;
  cardCount: number;
  cards: FlashcardItem[];
};

export type FlashcardReviewState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueDate: string;
};

export type DueFlashcard = FlashcardItem & {
  deckId: string;
  deckTitle: string;
  dueDate: string;
  review: FlashcardReviewState | null;
};

export type SrRating = 'again' | 'hard' | 'good' | 'easy';

export async function listFlashcardDecks(): Promise<{ items: FlashcardDeck[] }> {
  const { data } = await apiClient.get<{ items: FlashcardDeck[] }>('/flashcards/decks');
  return data;
}

export async function getDueFlashcards(): Promise<{ count: number; items: DueFlashcard[] }> {
  const { data } = await apiClient.get<{ count: number; items: DueFlashcard[] }>('/flashcards/due');
  return data;
}

export async function getDueFlashcardCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/flashcards/due/count');
  return data;
}

export async function getDeckDueCounts(): Promise<{ counts: Record<string, number> }> {
  const { data } = await apiClient.get<{ counts: Record<string, number> }>(
    '/flashcards/due/deck-counts',
  );
  return data;
}

export async function reviewFlashcard(input: {
  cardId: string;
  rating: SrRating;
}): Promise<{ review: FlashcardReviewState & { cardId: string } }> {
  const { data } = await apiClient.post<{ review: FlashcardReviewState & { cardId: string } }>(
    '/flashcards/review',
    input,
  );
  return data;
}
