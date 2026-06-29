import { apiClient } from './client';
import type { VocabularyWord } from './types';

type RawVocabulary = VocabularyWord & { _id?: string };

function normalizeWord(raw: RawVocabulary): VocabularyWord {
  return {
    id: raw.id ?? raw._id ?? raw.word,
    word: raw.word,
    pronunciation: raw.pronunciation,
    partOfSpeech: raw.partOfSpeech,
    meaning: raw.meaning,
    example: raw.example,
    synonyms: raw.synonyms,
    date: raw.date,
  };
}

export async function getTodaysVocabulary(): Promise<VocabularyWord> {
  const { data } = await apiClient.get<RawVocabulary>('/vocabulary/today');
  return normalizeWord(data);
}

export async function listRecentVocabulary(limit = 7): Promise<VocabularyWord[]> {
  const { data } = await apiClient.get<{ items: RawVocabulary[] }>('/vocabulary/recent', {
    params: { limit },
  });
  return (data.items ?? []).map(normalizeWord);
}
