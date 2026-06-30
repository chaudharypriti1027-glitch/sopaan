export type UserRole = 'student' | 'admin' | 'mentor';

export type UserStreak = {
  count: number;
  lastActiveDate: string | null;
};

export type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  isPremium: boolean;
  premiumPlan?: 'monthly' | 'yearly' | 'trial' | null;
  premiumExpiresAt?: string | null;
  coins: number;
  streak?: UserStreak;
  pushNotificationsEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = AuthTokens & {
  user: User;
};

export type RefreshResponse = {
  token?: string;
  accessToken: string;
  refreshToken?: string;
  user?: User;
};

export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type ProfileGoal = {
  examTrack?: string;
  targetYear?: number;
};

export type StudentProfile = {
  id: string;
  userId: string;
  education?: string;
  category?: string;
  state?: string;
  attemptNumber?: number;
  targetYear?: number;
  goal?: ProfileGoal;
  preferences?: Record<string, unknown>;
  completeness?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileResponse = {
  user: User;
  profile: StudentProfile;
};

export type Exam = {
  id: string;
  name: string;
  code?: string;
  slug?: string;
  category?: string;
  description?: string;
  eligibility?: { ageMin?: number; ageMax?: number; education?: string };
  stages?: { name: string; order: number }[];
  importantDates?: {
    label: string;
    date: string;
    type: 'open' | 'apply' | 'exam' | 'result' | 'admit' | 'other';
  }[];
  vacancies?: number;
  cutoffs?: { year: number; category: string; marks: number }[];
  recommendedBooks?: {
    title: string;
    author?: string;
    subject?: string;
    rating?: number;
    link?: string;
  }[];
  [key: string]: unknown;
};

export type ExamCalendarEntry = {
  examId: string;
  examName: string;
  examCode: string;
  category: string;
  label: string;
  date: string;
  type: 'open' | 'apply' | 'exam' | 'result' | 'admit' | 'other';
};

export type Course = {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  examTags?: string[];
  isFree?: boolean;
  thumbnailColor?: string;
  lessonCount?: number;
  progressPercent?: number;
  lessons?: {
    id?: string;
    _id?: string;
    title: string;
    order: number;
    videoUrl?: string;
    durationSec?: number;
    notes?: string;
  }[];
  progress?: {
    completedLessons?: string[];
    lastLessonId?: string;
    progressPercent?: number;
    updatedAt?: string;
  };
  examId?: string;
  [key: string]: unknown;
};

export type TestSummary = {
  id: string;
  title: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  durationMinutes?: number;
  durationSec?: number;
  type?: string;
  examTag?: string;
  status?: string;
  stats?: { attempts?: number; avgScore?: number; rating?: number };
};

export type TestOption = {
  key: string;
  text: string;
};

export type TestQuestion = {
  id: string;
  text: string;
  options: TestOption[];
  correctKey?: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
};

export type TestDetail = TestSummary & {
  questions: TestQuestion[];
};

export type SubmitTestResponse = {
  attempt: {
    id: string;
    testId: string;
    score: number;
    accuracy: number;
    totalTimeSec: number;
    percentile?: number;
    rank?: number;
    weakTopics?: string[];
    aiFeedback?: string;
    createdAt?: string;
  };
  coaching: {
    feedback: string;
    weakTopics: string[];
    actions: string[];
  };
  rewards?: unknown;
  answers: {
    questionId: string;
    selectedKey?: string | null;
    correct: boolean;
    timeSec?: number;
    question?: {
      text: string;
      topic?: string;
      subject?: string;
      correctKey?: string;
      explanation?: string;
      options?: TestOption[];
    } | null;
  }[];
};

export type AttemptSummary = {
  id: string;
  test?: {
    id?: string;
    _id?: string;
    title?: string;
    subject?: string;
    type?: string;
    examTag?: string;
  };
  score?: number;
  accuracy?: number;
  percentile?: number;
  rank?: number;
  weakTopics?: string[];
  submittedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type AttemptDetail = AttemptSummary & {
  test?: {
    id?: string;
    title?: string;
    subject?: string;
    type?: string;
  };
  totalTimeSec?: number;
  aiFeedback?: string;
  perQuestion?: {
    questionId: string;
    selectedKey?: string;
    correctKey?: string;
    isCorrect?: boolean;
    timeSec?: number;
    topic?: string;
    subject?: string;
  }[];
  timePerSection?: {
    subject: string;
    totalTimeSec: number;
    correct: number;
    total: number;
    accuracy: number;
  }[];
  comparison?: {
    you: { score: number; accuracy: number; totalTimeSec: number };
    topper: { score: number; accuracy: number; totalTimeSec: number };
    average: { score: number; accuracy: number; totalTimeSec: number };
  };
  answers?: unknown[];
};

export type CurrentAffair = {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  category?: string;
  source?: string;
  sourceUrl?: string;
  publishedAt?: string;
  imageUrl?: string;
  imageColor?: string;
  state?: string;
  quizQuestions?: string[];
  [key: string]: unknown;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

export type PlannerSession = {
  id: string;
  subject: string;
  topic?: string;
  startTime: string;
  durationMin: number;
  type: string;
  reason?: string;
  motivation?: string;
  completed: boolean;
  date?: string;
};

export type PlannerSessionsResponse = {
  items: PlannerSession[];
};

export type PlannerDayPlan = {
  date: string;
  summary: string;
  sessions: PlannerSession[];
};

export type ReadinessResponse = {
  score: number;
  examTrack: string;
  targetYear?: number;
  byArea: { name: string; pct: number }[];
  cutoffGap?: {
    target: number | null;
    current: number;
    gap: number | null;
    category?: string;
    year?: number;
    note?: string;
  };
  focusNext?: string[];
  assessedAt: string;
};

export type RoadmapStage = {
  name: string;
  order: number;
  status: 'completed' | 'current' | 'upcoming';
  tips: string[];
  progress: number;
};

export type GoalRoadmap = {
  examTrack: string;
  targetYear: number;
  examId?: string | null;
  examName: string;
  currentStage?: string;
  currentStageIndex?: number;
  overallProgress?: number;
  stages: RoadmapStage[];
  upcomingDates?: { label: string; date: string; type: string }[];
  generatedAt: string;
};

export type GoalResponse = {
  profile: StudentProfile;
  exam?: Exam | null;
  roadmap: GoalRoadmap;
};

export type VocabularyWord = {
  id: string;
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  meaning?: string;
  example?: string;
  synonyms?: string[];
  date?: string;
  [key: string]: unknown;
};

export type ApiErrorBody = {
  error: {
    message: string;
    code: string;
    details?: {
      feature?: string;
      paywallTitle?: string;
      paywallMessage?: string;
      limit?: number;
      usage?: number;
      attemptsRemaining?: number;
    };
  };
};
