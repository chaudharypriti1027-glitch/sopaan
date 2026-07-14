export type GameId =
  | 'memory-match'
  | 'word-scramble'
  | 'gk-bingo'
  | 'rapid-fire'
  | 'crossword'
  | 'map-quiz'
  | 'math-blitz'
  | 'grammar-fix'
  | 'science-lab'
  | 'history-line'
  | 'spelling-bee'
  | 'flag-master'
  | 'logic-puzzle'
  | 'number-ninja'
  | 'word-chain'
  | 'world-quiz'
  | 'trivia-blitz'
  | 'code-breaker'
  | 'story-builder';

export type GameCategory =
  | 'all'
  | 'language'
  | 'gk'
  | 'geography'
  | 'logic'
  | 'math'
  | 'science'
  | 'history';

export type GameIcon =
  | 'memory'
  | 'scramble'
  | 'bingo'
  | 'rapid'
  | 'crossword'
  | 'map'
  | 'math'
  | 'grammar'
  | 'science'
  | 'history'
  | 'spell'
  | 'flag'
  | 'logic'
  | 'number'
  | 'chain'
  | 'world'
  | 'trivia'
  | 'code'
  | 'story';

export type GameCatalogItem = {
  id: GameId;
  title: string;
  description: string;
  gradient: readonly [string, string];
  icon: GameIcon;
  badge?: string;
  coinReward: number;
  category: Exclude<GameCategory, 'all'>[];
};

export type MemoryPair = {
  id: string;
  term: string;
  meaning: string;
};

export type McqQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  label?: string;
  explanation?: string;
};

export type ScrambleWord = {
  id: string;
  word: string;
  hint: string;
};

export type MathProblem = {
  id: string;
  a: number;
  b: number;
  op: '+' | '-' | '×' | '÷';
};

export type HistoryEvent = {
  id: string;
  year: number;
  title: string;
  detail: string;
};

export type LogicPuzzle = {
  id: string;
  prompt: string;
  hint: string;
  cells: string[];
  answer: string;
};

export type WordChainRound = {
  id: string;
  startWord: string;
  validWords: string[];
};

export type StoryRound = {
  id: string;
  template: string;
  blankIndex: number;
  options: string[];
  answer: string;
};
