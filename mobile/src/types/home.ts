/**
 * Home page feed — mirrors shared/homeFeed.ts (GET /api/home).
 */

export interface HomeFeed {
  greeting: {
    name: string;
    message: string;
    dateLabel: string;
    avatarUrl?: string;
    unreadCount: number;
  };
  streak: { current: number; best: number; freezes: number; todayDone: boolean };
  rank: { air: number | null; percentile: number | null; deltaWeek: number; ringPct: number };
  countdown: { examName: string; daysLeft: number; dateLabel: string } | null;
  continue: ContinueItem[];
  aiNudges: AINudge[];
  dailyChallenge: {
    id: string;
    title: string;
    qCount: number;
    rewardCoins: number;
    status: 'todo' | 'done';
  } | null;
  quickActions: { key: string; label: string; icon: string; deeplink: string }[];
  recommendedTests: TestCard[];
  currentAffairs: AffairCard[];
  league: { tier: string; rankInLeague: number; xpThisWeek: number } | null;
  generatedAt: string;
}

export interface ContinueItem {
  id: string;
  kind: 'lesson' | 'test' | 'video';
  title: string;
  subtitle: string;
  progressPct: number;
  accent: 'primary' | 'teal' | 'gold' | 'coral';
  deeplink: string;
}

export interface AINudge {
  id: string;
  tone: 'urgent' | 'streak' | 'info' | 'opportunity';
  icon: string;
  title: string;
  body: string;
  deeplink: string;
}

export interface TestCard {
  id: string;
  title: string;
  qCount: number;
  durationMin: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tag?: string;
}

export interface AffairCard {
  id: string;
  source: string;
  headline: string;
  readMin: number;
  imageUrl?: string;
  imageColor?: string;
}
