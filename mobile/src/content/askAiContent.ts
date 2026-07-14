import type { LucideIcon } from 'lucide-react-native';
import { BookOpen, Brain, PenLine, TrendingUp } from 'lucide-react-native';
import type { PremiumIconTone } from '../components/premium/premiumIconTokens';

export type AskAiTab = 'ask' | 'evaluate';

export type AskAiPromptConfig = {
  key: string;
  tagKey: string;
  Icon: LucideIcon;
  tone: PremiumIconTone;
};

/** Starter prompts shown on the empty chat state. */
export const ASK_AI_PROMPTS: AskAiPromptConfig[] = [
  { key: 'prompt1', tagKey: 'promptTag1', Icon: TrendingUp, tone: 'gold' },
  { key: 'prompt2', tagKey: 'promptTag2', Icon: Brain, tone: 'lavender' },
  { key: 'prompt3', tagKey: 'promptTag3', Icon: BookOpen, tone: 'mint' },
  { key: 'prompt4', tagKey: 'promptTag4', Icon: PenLine, tone: 'rose' },
];

export const ASK_AI_TABS: AskAiTab[] = ['ask', 'evaluate'];

/** Stagger delay for prompt cards on empty state. */
export const ASK_AI_PROMPT_STAGGER_MS = 40;

/** Fast-reply threshold shown as "instant" badge. */
export const ASK_AI_INSTANT_MS = 2500;
