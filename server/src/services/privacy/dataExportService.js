import { Attempt } from '../../models/Attempt.js';
import { StudentProfile } from '../../models/StudentProfile.js';
import { PlannerSession } from '../../models/PlannerSession.js';
import { Notification } from '../../models/Notification.js';
import { FocusLog } from '../../models/FocusLog.js';
import { PhysicalLog } from '../../models/PhysicalLog.js';
import { Badge } from '../../models/Badge.js';
import { FlashcardReview } from '../../models/FlashcardReview.js';
import { TopicMastery } from '../../models/TopicMastery.js';
import { CourseProgress } from '../../models/CourseProgress.js';
import { DoubtPost } from '../../models/DoubtPost.js';
import { GroupChatMessage } from '../../models/GroupChatMessage.js';
import { LiveClassReminder } from '../../models/LiveClassReminder.js';
import { MentorBooking } from '../../models/MentorBooking.js';
import { Referral } from '../../models/Referral.js';
import { ExperimentAssignment } from '../../models/ExperimentAssignment.js';
import { ExperimentEvent } from '../../models/ExperimentEvent.js';
import { DailyQuotaUsage } from '../../models/DailyQuotaUsage.js';
import { AiDailyUsage } from '../../models/AiDailyUsage.js';
import { AiCallLog } from '../../models/AiCallLog.js';
import { AiModelFeedback } from '../../models/AiModelFeedback.js';
import { AnswerEvaluation } from '../../models/AnswerEvaluation.js';
import { PaymentOrder } from '../../models/PaymentOrder.js';
import { SubscriptionEntitlement } from '../../models/SubscriptionEntitlement.js';
import { User } from '../../models/User.js';
import { privacyConfig } from '../../config/privacyConfig.js';
import { getDataInventory } from '../../content/privacyPolicy.js';

const EXPORT_LIMIT = 5000;

export async function exportUserData(userId) {
  const user = await User.findById(userId).lean();

  if (!user) {
    return null;
  }

  const [
    profile,
    attempts,
    plannerSessions,
    notifications,
    focusLogs,
    physicalLogs,
    badges,
    flashcardReviews,
    topicMastery,
    courseProgress,
    doubtPosts,
    groupMessages,
    liveClassReminders,
    mentorBookings,
    referralsAsReferrer,
    referralsAsReferee,
    experimentAssignments,
    experimentEvents,
    dailyQuotaUsage,
    aiDailyUsage,
    aiCallLogs,
    aiModelFeedback,
    answerEvaluations,
    paymentOrders,
    subscriptionEntitlements,
  ] = await Promise.all([
    StudentProfile.findOne({ userId }).lean(),
    Attempt.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    PlannerSession.find({ userId }).sort({ date: -1 }).limit(EXPORT_LIMIT).lean(),
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    FocusLog.find({ userId }).sort({ date: -1 }).limit(EXPORT_LIMIT).lean(),
    PhysicalLog.find({ userId }).sort({ date: -1 }).limit(EXPORT_LIMIT).lean(),
    Badge.find({ userId }).lean(),
    FlashcardReview.find({ userId }).lean(),
    TopicMastery.find({ userId }).lean(),
    CourseProgress.find({ userId }).lean(),
    DoubtPost.find({ userId }).lean(),
    GroupChatMessage.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    LiveClassReminder.find({ userId }).lean(),
    MentorBooking.find({ studentId: userId }).lean(),
    Referral.find({ referrerId: userId }).lean(),
    Referral.find({ refereeId: userId }).lean(),
    ExperimentAssignment.find({ userId }).lean(),
    ExperimentEvent.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    DailyQuotaUsage.find({ userId }).lean(),
    AiDailyUsage.find({ userId }).lean(),
    AiCallLog.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    AiModelFeedback.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    AnswerEvaluation.find({ userId }).sort({ createdAt: -1 }).limit(EXPORT_LIMIT).lean(),
    PaymentOrder.find({ userId }).sort({ createdAt: -1 }).lean(),
    SubscriptionEntitlement.find({ userId }).lean(),
  ]);

  const safeUser = { ...user };
  delete safeUser.passwordHash;

  return {
    exportedAt: new Date().toISOString(),
    policyVersion: privacyConfig.policyVersion,
    dataInventory: getDataInventory(),
    note: 'Payment records may be retained separately for legal obligations after account deletion.',
    user: safeUser,
    profile,
    study: {
      attempts,
      plannerSessions,
      focusLogs,
      physicalLogs,
      badges,
      flashcardReviews,
      topicMastery,
      courseProgress,
    },
    community: {
      doubtPosts,
      groupMessages,
    },
    notifications,
    liveClassReminders,
    mentorBookings,
    referrals: {
      asReferrer: referralsAsReferrer,
      asReferee: referralsAsReferee,
    },
    experiments: {
      assignments: experimentAssignments,
      events: experimentEvents,
    },
    usage: {
      dailyQuotaUsage,
      aiDailyUsage,
      aiCallLogs,
      aiModelFeedback,
      answerEvaluations,
    },
    billing: {
      paymentOrders,
      subscriptionEntitlements,
    },
  };
}
