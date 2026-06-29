import type {
  HistoryEvent,
  LogicPuzzle,
  MathProblem,
  McqQuestion,
  ScrambleWord,
  StoryRound,
  WordChainRound,
} from './types';

export const SCIENCE_QUESTIONS: McqQuestion[] = [
  {
    id: 's1',
    label: '⚗️ Chemistry',
    prompt: 'What is the chemical symbol for Gold?',
    options: ['Go', 'Au', 'Gd', 'Ag'],
    answer: 'Au',
  },
  {
    id: 's2',
    label: '🔬 Biology',
    prompt: 'Photosynthesis occurs mainly in which organelle?',
    options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'],
    answer: 'Chloroplast',
  },
  {
    id: 's3',
    label: '⚡ Physics',
    prompt: 'SI unit of electric current is —',
    options: ['Volt', 'Ohm', 'Ampere', 'Watt'],
    answer: 'Ampere',
  },
  {
    id: 's4',
    label: '⚗️ Chemistry',
    prompt: 'Water is made of hydrogen and —',
    options: ['Carbon', 'Oxygen', 'Nitrogen', 'Helium'],
    answer: 'Oxygen',
  },
  {
    id: 's5',
    label: '🔬 Biology',
    prompt: 'DNA stands for —',
    options: [
      'Deoxyribonucleic Acid',
      'Dinitrogen Acid',
      'Dynamic Nuclear Acid',
      'Dual Nitrogen Array',
    ],
    answer: 'Deoxyribonucleic Acid',
  },
];

export const GRAMMAR_QUESTIONS: McqQuestion[] = [
  {
    id: 'g1',
    label: '✏️ Grammar',
    prompt: 'Choose the correct sentence:',
    options: [
      'She don\'t like tea.',
      'She doesn\'t like tea.',
      'She not like tea.',
      'She no like tea.',
    ],
    answer: 'She doesn\'t like tea.',
  },
  {
    id: 'g2',
    label: '✏️ Grammar',
    prompt: 'Pick the correct form:',
    options: [
      'He have gone to school.',
      'He has went to school.',
      'He has gone to school.',
      'He have went to school.',
    ],
    answer: 'He has gone to school.',
  },
  {
    id: 'g3',
    label: '✏️ Grammar',
    prompt: 'Which sentence is correct?',
    options: [
      'Neither of the boys were ready.',
      'Neither of the boys was ready.',
      'Neither boys was ready.',
      'Neither of boys were ready.',
    ],
    answer: 'Neither of the boys was ready.',
  },
  {
    id: 'g4',
    label: '✏️ Grammar',
    prompt: 'Correct plural of "child" is —',
    options: ['childs', 'children', 'childes', 'childern'],
    answer: 'children',
  },
  {
    id: 'g5',
    label: '✏️ Grammar',
    prompt: 'Choose the right article:',
    options: ['a honest man', 'an honest man', 'the honest man', 'honest man'],
    answer: 'an honest man',
  },
];

export const FLAG_QUESTIONS: McqQuestion[] = [
  {
    id: 'f1',
    prompt: '🇯🇵 Which country is this flag?',
    options: ['South Korea', 'Japan', 'China', 'Taiwan'],
    answer: 'Japan',
  },
  {
    id: 'f2',
    prompt: '🇮🇳 Which country is this flag?',
    options: ['Pakistan', 'India', 'Bangladesh', 'Nepal'],
    answer: 'India',
  },
  {
    id: 'f3',
    prompt: '🇧🇷 Which country is this flag?',
    options: ['Argentina', 'Portugal', 'Brazil', 'Mexico'],
    answer: 'Brazil',
  },
  {
    id: 'f4',
    prompt: '🇫🇷 Which country is this flag?',
    options: ['Belgium', 'France', 'Netherlands', 'Italy'],
    answer: 'France',
  },
  {
    id: 'f5',
    prompt: '🇬🇧 Which country is this flag?',
    options: ['United Kingdom', 'Australia', 'New Zealand', 'Ireland'],
    answer: 'United Kingdom',
  },
];

export const WORLD_QUESTIONS: McqQuestion[] = [
  {
    id: 'w1',
    label: '🌍 World',
    prompt: 'Capital of Australia is —',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    answer: 'Canberra',
  },
  {
    id: 'w2',
    label: '🌍 World',
    prompt: 'Capital of France is —',
    options: ['Lyon', 'Marseille', 'Paris', 'Nice'],
    answer: 'Paris',
  },
  {
    id: 'w3',
    label: '🌍 World',
    prompt: 'Capital of Japan is —',
    options: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'],
    answer: 'Tokyo',
  },
  {
    id: 'w4',
    label: '🌍 World',
    prompt: 'Capital of Canada is —',
    options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
    answer: 'Ottawa',
  },
  {
    id: 'w5',
    label: '🌍 World',
    prompt: 'Capital of Egypt is —',
    options: ['Alexandria', 'Cairo', 'Giza', 'Luxor'],
    answer: 'Cairo',
  },
];

export const TRIVIA_QUESTIONS: McqQuestion[] = [
  {
    id: 't1',
    label: '🎲 Mixed',
    prompt: 'Who discovered Penicillin?',
    options: ['Marie Curie', 'Alexander Fleming', 'Louis Pasteur', 'Isaac Newton'],
    answer: 'Alexander Fleming',
  },
  {
    id: 't2',
    label: '🎲 Mixed',
    prompt: 'Largest planet in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
    answer: 'Jupiter',
  },
  {
    id: 't3',
    label: '🎲 Mixed',
    prompt: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    answer: '7',
  },
  {
    id: 't4',
    label: '🎲 Mixed',
    prompt: 'Author of "Discovery of India"?',
    options: ['Gandhi', 'Tagore', 'Nehru', 'Ambedkar'],
    answer: 'Nehru',
  },
  {
    id: 't5',
    label: '🎲 Mixed',
    prompt: 'Speed of light is approximately —',
    options: ['3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'],
    answer: '3×10⁸ m/s',
  },
];

export const CODE_QUESTIONS: McqQuestion[] = [
  {
    id: 'c1',
    label: '💻 Logic',
    prompt: 'What comes next? 2, 4, 8, 16, __',
    options: ['24', '32', '20', '18'],
    answer: '32',
  },
  {
    id: 'c2',
    label: '💻 Logic',
    prompt: 'If A=1, B=2, C=3, what is D?',
    options: ['3', '4', '5', '6'],
    answer: '4',
  },
  {
    id: 'c3',
    label: '💻 Logic',
    prompt: 'Which is a valid variable name in most languages?',
    options: ['2score', 'my-var', 'my_var', 'class'],
    answer: 'my_var',
  },
  {
    id: 'c4',
    label: '💻 Logic',
    prompt: 'Binary 1010 in decimal is —',
    options: ['8', '10', '12', '14'],
    answer: '10',
  },
  {
    id: 'c5',
    label: '💻 Logic',
    prompt: 'Loop that runs at least once?',
    options: ['for', 'while', 'do-while', 'if'],
    answer: 'do-while',
  },
];

export const BINGO_QUESTIONS: McqQuestion[] = [
  {
    id: 'b1',
    prompt: 'The capital of Australia is ___?',
    options: ['Paris', 'Delhi', 'Canberra', 'Tokyo'],
    answer: 'Canberra',
  },
  {
    id: 'b2',
    prompt: 'Chemical formula of water?',
    options: ['CO₂', 'H₂O', 'NaCl', 'O₂'],
    answer: 'H₂O',
  },
  {
    id: 'b3',
    prompt: 'Who proposed the theory of gravity?',
    options: ['Darwin', 'Newton', 'Edison', 'Galileo'],
    answer: 'Newton',
  },
  {
    id: 'b4',
    prompt: 'Largest river by discharge?',
    options: ['Nile', 'Amazon', 'Ganga', 'Yangtze'],
    answer: 'Amazon',
  },
  {
    id: 'b5',
    prompt: 'Gas essential for respiration?',
    options: ['Nitrogen', 'Oxygen', 'Carbon', 'Helium'],
    answer: 'Oxygen',
  },
];

export const SPELLING_WORDS: ScrambleWord[] = [
  { id: 'sp1', word: 'GOVERNMENT', hint: 'System that runs a country' },
  { id: 'sp2', word: 'CONSTITUTION', hint: 'Supreme law of a nation' },
  { id: 'sp3', word: 'PARLIAMENT', hint: 'Legislative body of India' },
  { id: 'sp4', word: 'DEMOCRACY', hint: 'Rule by the people' },
  { id: 'sp5', word: 'FEDERALISM', hint: 'Division of power between centre and states' },
];

export const MATH_PROBLEMS: MathProblem[] = [
  { id: 'm1', a: 128, b: 8, op: '÷' },
  { id: 'm2', a: 45, b: 17, op: '+' },
  { id: 'm3', a: 72, b: 9, op: '×' },
  { id: 'm4', a: 100, b: 37, op: '-' },
  { id: 'm5', a: 144, b: 12, op: '÷' },
  { id: 'm6', a: 23, b: 19, op: '+' },
  { id: 'm7', a: 15, b: 6, op: '×' },
  { id: 'm8', a: 90, b: 45, op: '-' },
  { id: 'm9', a: 81, b: 9, op: '÷' },
  { id: 'm10', a: 56, b: 28, op: '+' },
];

export const HISTORY_SETS: HistoryEvent[][] = [
  [
    { id: 'h1', year: 1776, title: 'US Declaration of Independence', detail: 'American colonies break from Britain' },
    { id: 'h2', year: 1945, title: 'End of World War II', detail: 'Allied forces defeat Axis powers' },
    { id: 'h3', year: 1969, title: 'Moon Landing', detail: 'Apollo 11 — Neil Armstrong on the moon' },
    { id: 'h4', year: 1989, title: 'Fall of Berlin Wall', detail: 'Germany reunified; Cold War ends' },
  ],
  [
    { id: 'h5', year: 1857, title: 'Revolt of 1857', detail: 'First war of Indian independence' },
    { id: 'h6', year: 1947, title: 'Indian Independence', detail: 'India becomes a free nation' },
    { id: 'h7', year: 1950, title: 'Constitution Adopted', detail: 'India becomes a republic' },
    { id: 'h8', year: 1991, title: 'Economic Liberalisation', detail: 'India opens its economy' },
  ],
];

export const LOGIC_PUZZLES: LogicPuzzle[] = [
  {
    id: 'l1',
    prompt: 'Which item does NOT belong to this group?',
    hint: 'All others are aquatic animals.',
    cells: ['🐋', '🐬', '🐟', '🦭', '🦈', '🐙', '🐊', '🦑'],
    answer: '🐊',
  },
  {
    id: 'l2',
    prompt: 'Find the odd one out:',
    hint: 'All others are prime numbers.',
    cells: ['2', '3', '5', '7', '9', '11', '13', '17'],
    answer: '9',
  },
  {
    id: 'l3',
    prompt: 'Which does NOT belong?',
    hint: 'All others are Indian states.',
    cells: ['Gujarat', 'Kerala', 'Punjab', 'Kathmandu', 'Assam', 'Bihar', 'Odisha', 'Goa'],
    answer: 'Kathmandu',
  },
];

export const WORD_CHAIN_ROUNDS: WordChainRound[] = [
  {
    id: 'wc1',
    startWord: 'ATOM',
    validWords: ['MOLECULE', 'MATTER', 'MASS', 'METAL', 'MAGNET'],
  },
  {
    id: 'wc2',
    startWord: 'ENERGY',
    validWords: ['YIELD', 'YOUTH', 'YELLOW'],
  },
  {
    id: 'wc3',
    startWord: 'BUDGET',
    validWords: ['TAX', 'TRADE', 'TREND', 'TRUST'],
  },
];

export const STORY_ROUNDS: StoryRound[] = [
  {
    id: 'st1',
    template: 'The student opened the ___ and began to study.',
    blankIndex: 3,
    options: ['notebook', 'window', 'kitchen', 'garden'],
    answer: 'notebook',
  },
  {
    id: 'st2',
    template: 'Democracy means government ___ the people.',
    blankIndex: 3,
    options: ['by', 'against', 'without', 'above'],
    answer: 'by',
  },
  {
    id: 'st3',
    template: 'The Constitution protects our fundamental ___.',
    blankIndex: 5,
    options: ['rights', 'roads', 'rivers', 'rules'],
    answer: 'rights',
  },
];

export function solveMath(problem: MathProblem): number {
  switch (problem.op) {
    case '+':
      return problem.a + problem.b;
    case '-':
      return problem.a - problem.b;
    case '×':
      return problem.a * problem.b;
    case '÷':
      return problem.a / problem.b;
    default:
      return 0;
  }
}
