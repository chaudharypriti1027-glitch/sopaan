import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PremiumPlanId } from '../api/payments';
import type { SubmitTestResponse } from '../api/types';
import type { TierFeatureKey } from '../api/tier';
import type { GameId } from '../games/types';

export type PremiumPaywallParams = {
  feature?: TierFeatureKey;
  paywallTitle?: string;
  paywallMessage?: string;
  plan?: PremiumPlanId;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  GoalSetup: undefined;
  ProfileSetup: undefined;
  Signup: undefined;
  Login: undefined;
  Otp: {
    phone?: string;
    email?: string;
    privacyConsent?: {
      policyVersion: string;
      aiProcessing: true;
      marketing?: boolean;
    };
  };
  OtpLogin: { initialEmail?: string } | undefined;
  AdminPortal: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Practice: {
    topic?: string;
    subject?: string;
    activeTab?: 'sectional' | 'mock' | 'pyq';
    openForm?: boolean;
    weakTopics?: string[];
  } | undefined;
  CurrentAffairs: { digestId?: string; affairId?: string } | undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabParamList>;
  AskAI: { initialPrompt?: string } | undefined;
  Quiz: { testId: string };
  TestReady: {
    testId: string;
    subject?: string;
    topic?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    examTag?: string;
    questionCount?: number;
  };
  Result: {
    attemptId: string;
    testId: string;
    previousRank?: number;
    result: SubmitTestResponse;
  };
  ExamCalendar: undefined;
  ExamDetail: { examId?: string };
  Books: { examId?: string };
  BookReader: { bookId: string; startPage?: number; startLine?: number };
  Courses: undefined;
  CourseDetail: { courseId: string };
  LiveClasses: undefined;
  LiveClassViewer: { liveClassId: string };
  GroupChat: { groupId: string; groupName: string };
  CommunityTests: undefined;
  CreateTest: undefined;
  StudyPlanner: { date?: string } | undefined;
  FocusTimer: undefined;
  Wellness: undefined;
  ReferEarn: undefined;
  Rewards: undefined;
  Forum: undefined;
  Friends: undefined;
  Messages: undefined;
  DirectMessage: { conversationId: string; friendUserId: string; friendName: string };
  Mentors: undefined;
  MockAnalysis: { attemptId?: string };
  AnswerEvaluation: undefined;
  CutoffsForms: undefined;
  Flashcards: undefined;
  PhysicalTest: undefined;
  Roadmap: undefined;
  ExamPlan: undefined;
  Readiness: undefined;
  ProgressAnalytics: { weekKey?: string } | undefined;
  TestSeries: { seriesId?: string; testId?: string } | undefined;
  RevisionCapsules: undefined;
  Vocabulary: undefined;
  Notifications: undefined;
  Notes: undefined;
  Premium: PremiumPaywallParams | undefined;
  ManageSubscription: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  DeleteAccount: undefined;
  SuccessStories: undefined;
  Leaderboard: { testId?: string } | undefined;
  Search: undefined;
  Games: undefined;
  GamePlay: { gameId: GameId; sessionId?: number; affairId?: string };
  CurrentAffairReader: { affairId: string };
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required by react-navigation's global typing pattern
    interface RootParamList extends RootStackParamList {}
  }
}
