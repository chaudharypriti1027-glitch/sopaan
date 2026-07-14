import { clampGameScore } from './score';

export type GameAnswerRecord = {
  questionId: string;
  prompt?: string;
  topic?: string;
  selected?: string;
  correct: boolean;
  correctAnswer?: string;
  explanation?: string;
};

export type GameCompleteResult = {
  score: number;
  answers?: GameAnswerRecord[];
};

export function normalizeGameComplete(result: number | GameCompleteResult): GameCompleteResult {
  if (typeof result === 'number') {
    return { score: clampGameScore(result) };
  }

  return {
    score: clampGameScore(result.score),
    answers: result.answers,
  };
}

export function gameComplete(score: number, answers?: GameAnswerRecord[]): GameCompleteResult {
  return normalizeGameComplete({ score, answers });
}
