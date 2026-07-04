import { useCallback, useEffect, useState } from 'react';
import {
  getDailyChallengeGameId,
  getDailyChallengeProgress,
  loadGameProgress,
  recordGameCompletion,
  type GameProgressState,
} from '../games/progress';
import type { GameId } from '../games/types';

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgressState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProgress(await loadGameProgress());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recordComplete = useCallback(async (gameId: GameId, score: number) => {
    const next = await recordGameCompletion(gameId, score);
    setProgress(next);
    return next;
  }, []);

  const dailyChallengeGameId = getDailyChallengeGameId();
  const dailyProgress = progress ? getDailyChallengeProgress(progress) : 0;

  return {
    progress,
    loading,
    refresh,
    recordComplete,
    dailyChallengeGameId,
    dailyProgress,
    gamesDone: progress?.gamesCompleted ?? 0,
    lastPlayedGameId: progress?.lastPlayedGameId ?? null,
    bestScores: progress?.bestScores ?? {},
  };
}
