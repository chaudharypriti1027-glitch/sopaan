import type { ReactElement } from 'react';
import {
  CODE_QUESTIONS,
  FLAG_QUESTIONS,
  GRAMMAR_QUESTIONS,
  SCIENCE_QUESTIONS,
  TRIVIA_QUESTIONS,
  WORLD_QUESTIONS,
} from './banks';
import { CrosswordMiniGame } from './CrosswordMiniGame';
import { GK_QUESTIONS, MAP_QUESTIONS } from './content';
import { GKBingoGame } from './GKBingoGame';
import { HistoryLineGame } from './HistoryLineGame';
import { LogicPuzzleGame } from './LogicPuzzleGame';
import { MathBlitzGame } from './MathBlitzGame';
import { McqSequenceGame } from './McqSequenceGame';
import { McqTimedGame } from './McqTimedGame';
import { MemoryMatchGame } from './MemoryMatchGame';
import { SpellingBeeGame } from './SpellingBeeGame';
import { StoryBuilderGame } from './StoryBuilderGame';
import { WordChainGame } from './WordChainGame';
import { WordScrambleGame } from './WordScrambleGame';
import type { GameId } from './types';

export type GameSessionProps = {
  sessionKey: string;
  onComplete: (score: number) => void;
};

export function renderGameById(id: GameId, { sessionKey, onComplete }: GameSessionProps): ReactElement | null {
  const key = sessionKey;

  switch (id) {
    case 'memory-match':
      return <MemoryMatchGame key={key} onComplete={onComplete} />;
    case 'word-scramble':
      return <WordScrambleGame key={key} onComplete={onComplete} />;
    case 'gk-bingo':
      return <GKBingoGame key={key} onComplete={onComplete} />;
    case 'rapid-fire':
      return (
        <McqTimedGame
          key={key}
          questions={GK_QUESTIONS}
          durationSec={60}
          label="⚡ RAPID FIRE"
          onComplete={onComplete}
        />
      );
    case 'crossword':
      return <CrosswordMiniGame key={key} onComplete={onComplete} />;
    case 'map-quiz':
      return (
        <McqTimedGame
          key={key}
          questions={MAP_QUESTIONS}
          durationSec={45}
          label="🗺️ MAP QUIZ"
          onComplete={onComplete}
        />
      );
    case 'math-blitz':
      return <MathBlitzGame key={key} rounds={10} durationSec={120} onComplete={onComplete} />;
    case 'number-ninja':
      return <MathBlitzGame key={key} rounds={8} durationSec={60} onComplete={onComplete} />;
    case 'grammar-fix':
      return (
        <McqSequenceGame
          key={key}
          questions={GRAMMAR_QUESTIONS}
          label="✏️ Grammar"
          onComplete={onComplete}
        />
      );
    case 'science-lab':
      return <McqSequenceGame key={key} questions={SCIENCE_QUESTIONS} onComplete={onComplete} />;
    case 'history-line':
      return <HistoryLineGame key={key} onComplete={onComplete} />;
    case 'spelling-bee':
      return <SpellingBeeGame key={key} onComplete={onComplete} />;
    case 'flag-master':
      return <McqSequenceGame key={key} questions={FLAG_QUESTIONS} onComplete={onComplete} />;
    case 'logic-puzzle':
      return <LogicPuzzleGame key={key} onComplete={onComplete} />;
    case 'word-chain':
      return <WordChainGame key={key} onComplete={onComplete} />;
    case 'world-quiz':
      return (
        <McqSequenceGame
          key={key}
          questions={WORLD_QUESTIONS}
          label="🌍 World"
          onComplete={onComplete}
        />
      );
    case 'trivia-blitz':
      return (
        <McqTimedGame
          key={key}
          questions={TRIVIA_QUESTIONS}
          durationSec={75}
          label="🎲 TRIVIA BLITZ"
          onComplete={onComplete}
        />
      );
    case 'code-breaker':
      return (
        <McqSequenceGame
          key={key}
          questions={CODE_QUESTIONS}
          label="💻 Code Breaker"
          onComplete={onComplete}
        />
      );
    case 'story-builder':
      return <StoryBuilderGame key={key} onComplete={onComplete} />;
    default:
      return null;
  }
}
