import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_CATALOG } from './content';
import type { GameId } from './types';
import { getDailyChallengeGameId as resolveDailyChallengeGameId } from '@sopaan/shared/dailyChallenge';

const STORAGE_KEY = 'sopaan_game_progress_v1';

export type GameProgressState = {
  gamesCompleted: number;
  lastPlayedGameId: GameId | null;
  lastPlayedAt: string | null;
  bestScores: Partial<Record<GameId, number>>;
  dailyChallenge: {
    dateKey: string;
    gameId: GameId;
    completed: boolean;
  };
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallengeGameId(date = new Date()): GameId {
  const id = resolveDailyChallengeGameId(date);
  return GAME_CATALOG.some((game) => game.id === id) ? (id as GameId) : GAME_CATALOG[0].id;
}

function normalizeProgress(raw: Partial<GameProgressState> | null): GameProgressState {
  const dateKey = todayKey();
  const dailyGameId = getDailyChallengeGameId();
  const daily = raw?.dailyChallenge;

  return {
    gamesCompleted: raw?.gamesCompleted ?? 0,
    lastPlayedGameId: raw?.lastPlayedGameId ?? null,
    lastPlayedAt: raw?.lastPlayedAt ?? null,
    bestScores: raw?.bestScores ?? {},
    dailyChallenge:
      daily?.dateKey === dateKey
        ? { dateKey, gameId: daily.gameId, completed: Boolean(daily.completed) }
        : { dateKey, gameId: dailyGameId, completed: false },
  };
}

export async function loadGameProgress(): Promise<GameProgressState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeProgress(null);
    return normalizeProgress(JSON.parse(raw) as GameProgressState);
  } catch {
    return normalizeProgress(null);
  }
}

export async function saveGameProgress(state: GameProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function recordGameCompletion(
  gameId: GameId,
  score: number,
): Promise<GameProgressState> {
  const current = await loadGameProgress();
  const dateKey = todayKey();
  const dailyGameId = getDailyChallengeGameId();
  const prevBest = current.bestScores[gameId] ?? 0;
  const isDaily = gameId === (current.dailyChallenge.dateKey === dateKey
    ? current.dailyChallenge.gameId
    : dailyGameId);

  const next: GameProgressState = {
    gamesCompleted: current.gamesCompleted + 1,
    lastPlayedGameId: gameId,
    lastPlayedAt: new Date().toISOString(),
    bestScores: {
      ...current.bestScores,
      [gameId]: Math.max(prevBest, score),
    },
    dailyChallenge: {
      dateKey,
      gameId: current.dailyChallenge.dateKey === dateKey ? current.dailyChallenge.gameId : dailyGameId,
      completed: isDaily ? true : current.dailyChallenge.dateKey === dateKey && current.dailyChallenge.completed,
    },
  };

  await saveGameProgress(next);
  return next;
}

export function getDailyChallengeProgress(progress: GameProgressState): number {
  return progress.dailyChallenge.completed ? 100 : 0;
}
