export * from './types';
export { ApiError, parseApiError } from './errors';
export { getUserFacingMessage } from '../errors/getUserFacingMessage';
export { apiClient, setSessionExpiredHandler } from './client';
export * as authApi from './auth';
export * as meApi from './me';
export * as mediaApi from './media';
export * as profileApi from './profile';
export * as examsApi from './exams';
export * as testsApi from './tests';
export * as attemptsApi from './attempts';
export * as coursesApi from './courses';
export * as currentAffairsApi from './currentAffairs';
export * as notificationsApi from './notifications';
export * as plannerApi from './planner';
export * as aiApi from './ai';
export * as analyticsApi from './analytics';
export type { GenerateTestInput, AskDoubtInput, EvaluateAnswerInput, ReportAiFeedbackInput } from './ai';
export type { AnalyticsRange, ProgressAnalytics } from './analytics';
export * as booksApi from './books';
export * as revisionCapsulesApi from './revisionCapsules';
export * as vocabularyApi from './vocabulary';
export * as doubtsApi from './doubts';
export * as groupsApi from './groups';
export * as mentorsApi from './mentors';
export * as liveClassesApi from './liveClasses';
export * as leaderboardApi from './leaderboard';
export * as successStoriesApi from './successStories';
export * as focusApi from './focus';
export * as gamesApi from './games';
export * as physicalApi from './physical';
export * as rewardsApi from './rewards';
export * as referralsApi from './referrals';
export * as experimentsApi from './experiments';
export * as tierApi from './tier';
export * as wellnessApi from './wellness';
export * as flashcardsApi from './flashcards';
export * as adminApi from './admin';
export * as adminContentApi from './adminContent';
export * as paymentsApi from './payments';
export * as privacyApi from './privacy';
export * as resourcesApi from './resources';
export type { SignupInput, LoginInput, OtpRequestInput, OtpVerifyInput } from './auth';
export type { UpdateMeInput } from './me';
export type { UpdateProfileInput, UpdateGoalInput } from './profile';
export type { ListTestsParams, SubmitTestInput } from './tests';
export type { ListAttemptsParams } from './attempts';
export type { Book } from './books';
export type { RevisionCapsule } from './revisionCapsules';
export type { ListCurrentAffairsParams } from './currentAffairs';
export type { CreateCommunityTestInput, CommunityQuestionInput, ListCommunityTestsParams } from './tests';
export type { DoubtPost, CreateDoubtInput } from './doubts';
export type { StudyGroup, CreateGroupInput } from './groups';
export type { Mentor, MentorSlot } from './mentors';
export type { LiveClass, LiveClassesResponse } from './liveClasses';
export type { LeaderboardEntry, LeaderboardResponse } from './leaderboard';
export type { SuccessStory } from './successStories';
export type { FocusLogInput } from './focus';
export type { CompleteGameInput, CompleteGameResponse } from './games';
export type {
  PhysicalStandard,
  PhysicalLog,
  PhysicalComparison,
  PhysicalFitnessPlan,
  CreatePhysicalLogInput,
} from './physical';
export type { Reward, Badge } from './rewards';
export type { WellnessSession } from './wellness';
export type { FlashcardItem, FlashcardDeck, DueFlashcard, SrRating } from './flashcards';
export type { AdminStats, PendingTest, GenerateExamInput } from './admin';
export type {
  PremiumPlan,
  PremiumPlanId,
  PremiumPlansResponse,
  CreateOrderResponse,
  VerifyPaymentInput,
  VerifyPaymentResponse,
  SubscriptionEntitlement,
  EntitlementStatus,
  EntitlementPlan,
  PaymentHistoryItem,
  EntitlementResponse,
  RestorePurchasesResponse,
} from './payments';
export type { CourseProgressInput } from './courses';
export * as testSeriesApi from './testSeries';
export type { TestSeries, TestSeriesMock, MockScheduleState } from './testSeries';
export * as searchApi from './search';
export * as questionsApi from './questions';
export type {
  CreatePlannerSessionInput,
  PlannerSessionsParams,
} from './planner';
export * from './home';
export type { HomeFeed, ContinueItem, AINudge, TestCard, AffairCard } from '../types/home';
export type {
  ExperimentAssignments,
  ExperimentPayloads,
  ExperimentsResponse,
  ExperimentEventName,
} from './experiments';
export type {
  TierFeatureKey,
  TierStatusResponse,
  TierLimits,
  TierUsageSnapshot,
} from './tier';
