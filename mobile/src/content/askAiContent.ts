import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  Brain,
  Landmark,
  PenLine,
  Scale,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import type { PremiumIconTone } from '../components/premium/premiumIconTokens';

export type AskAiTab = 'ask' | 'evaluate';

/** Exam families used to personalize Ask AI prompts. */
export type AskAiExamFamily =
  | 'ssc'
  | 'banking'
  | 'railway'
  | 'defence'
  | 'teaching'
  | 'upsc'
  | 'state_psc'
  | 'police'
  | 'general';

export type AskAiPromptConfig = {
  /** i18n key under askAi (without namespace prefix), e.g. examPrompts.ssc.p1 */
  key: string;
  tagKey: string;
  Icon: LucideIcon;
  tone: PremiumIconTone;
};

/** Starter prompts shown on the empty chat state (legacy / fallback). */
export const ASK_AI_PROMPTS: AskAiPromptConfig[] = [
  { key: 'prompt1', tagKey: 'promptTag1', Icon: TrendingUp, tone: 'gold' },
  { key: 'prompt2', tagKey: 'promptTag2', Icon: Brain, tone: 'lavender' },
  { key: 'prompt3', tagKey: 'promptTag3', Icon: BookOpen, tone: 'mint' },
  { key: 'prompt4', tagKey: 'promptTag4', Icon: PenLine, tone: 'rose' },
];

const FAMILY_PROMPTS: Record<AskAiExamFamily, AskAiPromptConfig[]> = {
  ssc: [
    { key: 'examPrompts.ssc.p1', tagKey: 'examPrompts.ssc.t1', Icon: TrendingUp, tone: 'gold' },
    { key: 'examPrompts.ssc.p2', tagKey: 'examPrompts.ssc.t2', Icon: Brain, tone: 'lavender' },
    { key: 'examPrompts.ssc.p3', tagKey: 'examPrompts.ssc.t3', Icon: BookOpen, tone: 'mint' },
  ],
  banking: [
    { key: 'examPrompts.banking.p1', tagKey: 'examPrompts.banking.t1', Icon: Landmark, tone: 'gold' },
    { key: 'examPrompts.banking.p2', tagKey: 'examPrompts.banking.t2', Icon: TrendingUp, tone: 'mint' },
    { key: 'examPrompts.banking.p3', tagKey: 'examPrompts.banking.t3', Icon: Brain, tone: 'lavender' },
  ],
  railway: [
    { key: 'examPrompts.railway.p1', tagKey: 'examPrompts.railway.t1', Icon: TrendingUp, tone: 'gold' },
    { key: 'examPrompts.railway.p2', tagKey: 'examPrompts.railway.t2', Icon: Brain, tone: 'lavender' },
    { key: 'examPrompts.railway.p3', tagKey: 'examPrompts.railway.t3', Icon: BookOpen, tone: 'mint' },
  ],
  defence: [
    { key: 'examPrompts.defence.p1', tagKey: 'examPrompts.defence.t1', Icon: Shield, tone: 'gold' },
    { key: 'examPrompts.defence.p2', tagKey: 'examPrompts.defence.t2', Icon: BookOpen, tone: 'mint' },
    { key: 'examPrompts.defence.p3', tagKey: 'examPrompts.defence.t3', Icon: Brain, tone: 'lavender' },
  ],
  teaching: [
    { key: 'examPrompts.teaching.p1', tagKey: 'examPrompts.teaching.t1', Icon: Users, tone: 'gold' },
    { key: 'examPrompts.teaching.p2', tagKey: 'examPrompts.teaching.t2', Icon: BookOpen, tone: 'mint' },
    { key: 'examPrompts.teaching.p3', tagKey: 'examPrompts.teaching.t3', Icon: PenLine, tone: 'rose' },
  ],
  upsc: [
    { key: 'examPrompts.upsc.p1', tagKey: 'examPrompts.upsc.t1', Icon: Scale, tone: 'gold' },
    { key: 'examPrompts.upsc.p2', tagKey: 'examPrompts.upsc.t2', Icon: Landmark, tone: 'mint' },
    { key: 'examPrompts.upsc.p3', tagKey: 'examPrompts.upsc.t3', Icon: BookOpen, tone: 'lavender' },
  ],
  state_psc: [
    { key: 'examPrompts.state_psc.p1', tagKey: 'examPrompts.state_psc.t1', Icon: Scale, tone: 'gold' },
    { key: 'examPrompts.state_psc.p2', tagKey: 'examPrompts.state_psc.t2', Icon: BookOpen, tone: 'mint' },
    { key: 'examPrompts.state_psc.p3', tagKey: 'examPrompts.state_psc.t3', Icon: Brain, tone: 'lavender' },
  ],
  police: [
    { key: 'examPrompts.police.p1', tagKey: 'examPrompts.police.t1', Icon: Shield, tone: 'gold' },
    { key: 'examPrompts.police.p2', tagKey: 'examPrompts.police.t2', Icon: TrendingUp, tone: 'mint' },
    { key: 'examPrompts.police.p3', tagKey: 'examPrompts.police.t3', Icon: Brain, tone: 'lavender' },
  ],
  general: ASK_AI_PROMPTS.slice(0, 3),
};

/**
 * Map a stored targetExam string to a content family.
 * Keeps banking students off UPSC prompts, etc.
 */
export function resolveAskAiExamFamily(targetExam: string | null | undefined): AskAiExamFamily {
  const exam = (targetExam ?? '').trim().toLowerCase();
  if (!exam) return 'general';

  if (/\bssc\b|cgl|chsl|cpo|gd|mts|steno/.test(exam)) return 'ssc';
  if (/ibps|sbi|rrb\s*po|bank|clerk|nabard|nicl|lic\s*aa/.test(exam)) return 'banking';
  if (/rrb|railway|ntpc|group\s*d|alp|technician/.test(exam)) return 'railway';
  if (/cds|afcat|nda|capf|indian\s*army|navy|air\s*force|defence|defense/.test(exam)) {
    return 'defence';
  }
  if (/ctet|tet|net|teaching|b\.?ed|kvs|nvs/.test(exam)) return 'teaching';
  if (/upsc|cse|ias|ips|civil\s*service/.test(exam)) return 'upsc';
  if (/psc|mppsc|uppsc|bpsc|gpsc|rpsc|state\s*service|state\s*psc/.test(exam)) {
    return 'state_psc';
  }
  if (/police|constable|si\b|sub.?inspector|hapc|ssc\s*gd/.test(exam)) return 'police';

  return 'general';
}

/** Prompts tailored to the student's selected exam / job track. */
export function getAskAiPromptsForExam(targetExam: string | null | undefined): AskAiPromptConfig[] {
  const family = resolveAskAiExamFamily(targetExam);
  return FAMILY_PROMPTS[family] ?? FAMILY_PROMPTS.general;
}

export const ASK_AI_TABS: AskAiTab[] = ['ask', 'evaluate'];

/** Stagger delay for prompt cards on empty state. */
export const ASK_AI_PROMPT_STAGGER_MS = 40;

/** Fast-reply threshold shown as "instant" badge. */
export const ASK_AI_INSTANT_MS = 2500;
