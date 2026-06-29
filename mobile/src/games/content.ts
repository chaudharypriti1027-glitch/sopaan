import { GAME_GRADIENTS } from './gamesTheme';
import type { GameCatalogItem, McqQuestion, MemoryPair, ScrambleWord } from './types';

export const GAME_CATALOG: GameCatalogItem[] = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Terms ↔ meanings',
    gradient: GAME_GRADIENTS.memory,
    icon: 'memory',
    coinReward: 15,
    category: ['logic', 'gk'],
  },
  {
    id: 'word-scramble',
    title: 'Word Scramble',
    description: 'Vocab builder',
    gradient: GAME_GRADIENTS.scramble,
    icon: 'scramble',
    coinReward: 12,
    badge: 'HOT',
    category: ['language'],
  },
  {
    id: 'gk-bingo',
    title: 'GK Bingo',
    description: '5×5 knowledge grid',
    gradient: GAME_GRADIENTS.bingo,
    icon: 'bingo',
    coinReward: 20,
    category: ['gk'],
  },
  {
    id: 'rapid-fire',
    title: 'Rapid Fire',
    description: '60-sec GK',
    gradient: GAME_GRADIENTS.rapid,
    icon: 'rapid',
    coinReward: 18,
    badge: 'FAST',
    category: ['gk'],
  },
  {
    id: 'crossword',
    title: 'Crossword',
    description: 'Exam terms',
    gradient: GAME_GRADIENTS.crossword,
    icon: 'crossword',
    coinReward: 10,
    category: ['language', 'gk'],
  },
  {
    id: 'map-quiz',
    title: 'Map Quiz',
    description: 'Geography',
    gradient: GAME_GRADIENTS.map,
    icon: 'map',
    coinReward: 14,
    category: ['geography', 'gk'],
  },
  {
    id: 'math-blitz',
    title: 'Math Blitz',
    description: 'Mental math',
    gradient: GAME_GRADIENTS.math,
    icon: 'math',
    coinReward: 20,
    badge: 'NEW',
    category: ['math'],
  },
  {
    id: 'grammar-fix',
    title: 'Grammar Fix',
    description: 'Correct sentences',
    gradient: GAME_GRADIENTS.grammar,
    icon: 'grammar',
    coinReward: 16,
    category: ['language'],
  },
  {
    id: 'science-lab',
    title: 'Science Lab',
    description: 'Physics & Chem',
    gradient: GAME_GRADIENTS.science,
    icon: 'science',
    coinReward: 15,
    category: ['science'],
  },
  {
    id: 'history-line',
    title: 'History Line',
    description: 'Order events',
    gradient: GAME_GRADIENTS.history,
    icon: 'history',
    coinReward: 22,
    badge: 'NEW',
    category: ['history', 'gk'],
  },
  {
    id: 'spelling-bee',
    title: 'Spelling Bee',
    description: 'Spell it right',
    gradient: GAME_GRADIENTS.spell,
    icon: 'spell',
    coinReward: 13,
    category: ['language'],
  },
  {
    id: 'flag-master',
    title: 'Flag Master',
    description: 'Country flags',
    gradient: GAME_GRADIENTS.flag,
    icon: 'flag',
    coinReward: 11,
    category: ['geography', 'gk'],
  },
  {
    id: 'logic-puzzle',
    title: 'Logic Puzzle',
    description: 'Patterns & sequences',
    gradient: GAME_GRADIENTS.logic,
    icon: 'logic',
    coinReward: 25,
    badge: 'HARD',
    category: ['logic'],
  },
  {
    id: 'number-ninja',
    title: 'Number Ninja',
    description: 'Fast calculations',
    gradient: GAME_GRADIENTS.number,
    icon: 'number',
    coinReward: 17,
    category: ['math'],
  },
  {
    id: 'word-chain',
    title: 'Word Chain',
    description: 'Link words',
    gradient: GAME_GRADIENTS.chain,
    icon: 'chain',
    coinReward: 14,
    category: ['language', 'logic'],
  },
  {
    id: 'world-quiz',
    title: 'World Quiz',
    description: 'Capitals & cultures',
    gradient: GAME_GRADIENTS.world,
    icon: 'world',
    coinReward: 16,
    badge: 'NEW',
    category: ['geography', 'gk'],
  },
  {
    id: 'trivia-blitz',
    title: 'Trivia Blitz',
    description: 'Mixed categories',
    gradient: GAME_GRADIENTS.trivia,
    icon: 'trivia',
    coinReward: 19,
    badge: 'MIX',
    category: ['gk'],
  },
  {
    id: 'code-breaker',
    title: 'Code Breaker',
    description: 'Logic & coding',
    gradient: GAME_GRADIENTS.code,
    icon: 'code',
    coinReward: 28,
    badge: 'HARD',
    category: ['logic'],
  },
  {
    id: 'story-builder',
    title: 'Story Builder',
    description: 'Creative writing',
    gradient: GAME_GRADIENTS.story,
    icon: 'story',
    coinReward: 18,
    badge: 'NEW',
    category: ['language'],
  },
];

export const MEMORY_PAIRS: MemoryPair[] = [
  { id: '1', term: 'GDP', meaning: 'Gross Domestic Product' },
  { id: '2', term: 'CPI', meaning: 'Consumer Price Index' },
  { id: '3', term: 'FRBM', meaning: 'Fiscal Responsibility Act' },
  { id: '4', term: 'GST', meaning: 'Goods & Services Tax' },
  { id: '5', term: 'NITI', meaning: 'National Institution for Transforming India' },
  { id: '6', term: 'SEBI', meaning: 'Securities & Exchange Board' },
];

export const SCRAMBLE_WORDS: ScrambleWord[] = [
  { id: '1', word: 'FEDERALISM', hint: 'Division of power between centre and states' },
  { id: '2', word: 'DEMOCRACY', hint: 'Government by the people' },
  { id: '3', word: 'INFLATION', hint: 'Rise in general price level' },
  { id: '4', word: 'BUDGET', hint: 'Annual financial statement' },
  { id: '5', word: 'MANDATE', hint: 'Authority given by voters' },
];

export const GK_QUESTIONS: McqQuestion[] = [
  {
    id: '1',
    prompt: 'Who is known as the Father of the Indian Constitution?',
    options: ['Jawaharlal Nehru', 'B.R. Ambedkar', 'Rajendra Prasad', 'Sardar Patel'],
    answer: 'B.R. Ambedkar',
  },
  {
    id: '2',
    prompt: 'Which article deals with Right to Equality?',
    options: ['Article 12', 'Article 14', 'Article 19', 'Article 21'],
    answer: 'Article 14',
  },
  {
    id: '3',
    prompt: 'The Tropic of Cancer passes through how many Indian states?',
    options: ['6', '7', '8', '9'],
    answer: '8',
  },
  {
    id: '4',
    prompt: 'Which river is known as Dakshin Ganga?',
    options: ['Krishna', 'Godavari', 'Kaveri', 'Mahanadi'],
    answer: 'Godavari',
  },
  {
    id: '5',
    prompt: 'GST was implemented in India in which year?',
    options: ['2015', '2016', '2017', '2018'],
    answer: '2017',
  },
  {
    id: '6',
    prompt: 'Capital of Gujarat is —',
    options: ['Surat', 'Vadodara', 'Gandhinagar', 'Ahmedabad'],
    answer: 'Gandhinagar',
  },
  {
    id: '7',
    prompt: 'Largest state of India by area?',
    options: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
    answer: 'Rajasthan',
  },
  {
    id: '8',
    prompt: 'Planning Commission was replaced by —',
    options: ['Finance Commission', 'NITI Aayog', 'RBI', 'Election Commission'],
    answer: 'NITI Aayog',
  },
];

export const MAP_QUESTIONS: McqQuestion[] = [
  {
    id: 'm1',
    prompt: 'Which state has the longest coastline in India?',
    options: ['Kerala', 'Gujarat', 'Tamil Nadu', 'Andhra Pradesh'],
    answer: 'Gujarat',
  },
  {
    id: 'm2',
    prompt: 'Sundarbans mangrove forest is mainly in —',
    options: ['Odisha', 'West Bengal', 'Assam', 'Kerala'],
    answer: 'West Bengal',
  },
  {
    id: 'm3',
    prompt: 'Which city is on the banks of the Ganga?',
    options: ['Mumbai', 'Varanasi', 'Chennai', 'Hyderabad'],
    answer: 'Varanasi',
  },
  {
    id: 'm4',
    prompt: 'Western Ghats are also called —',
    options: ['Sahyadri', 'Vindhyas', 'Aravalli', 'Satpura'],
    answer: 'Sahyadri',
  },
  {
    id: 'm5',
    prompt: 'Capital of Assam is —',
    options: ['Guwahati', 'Shillong', 'Dispur', 'Imphal'],
    answer: 'Dispur',
  },
];

export const CROSSWORD_CLUES: ScrambleWord[] = [
  { id: 'c1', word: 'LOKPAL', hint: 'Anti-corruption ombudsman' },
  { id: 'c2', word: 'RAJYA', hint: 'Upper house of Parliament (first word)' },
  { id: 'c3', word: 'FISCAL', hint: 'Related to government revenue' },
];

export function getGameById(id: string) {
  return GAME_CATALOG.find((game) => game.id === id);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
