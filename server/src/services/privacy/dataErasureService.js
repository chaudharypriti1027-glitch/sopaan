import crypto from 'crypto';
import bcrypt from 'bcrypt';
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
import { StudyGroup } from '../../models/StudyGroup.js';
import { Referral } from '../../models/Referral.js';
import { ExperimentAssignment } from '../../models/ExperimentAssignment.js';
import { ExperimentEvent } from '../../models/ExperimentEvent.js';
import { DailyQuotaUsage } from '../../models/DailyQuotaUsage.js';
import { AiDailyUsage } from '../../models/AiDailyUsage.js';
import { AiCallLog } from '../../models/AiCallLog.js';
import { AiDoubtCache } from '../../models/AiDoubtCache.js';
import { AiDoubtAnswer } from '../../models/AiDoubtAnswer.js';
import { AiModelFeedback } from '../../models/AiModelFeedback.js';
import { SubscriptionEntitlement } from '../../models/SubscriptionEntitlement.js';
import { User } from '../../models/User.js';
import { privacyConfig } from '../../config/privacyConfig.js';
import { revokeAllUserRefreshTokens } from '../../lib/tokenDenylist.js';
import { logger } from '../../observability/logger.js';

export async function eraseUserData(userId) {
  const user = await User.findById(userId);

  if (!user || user.accountStatus === 'deleted') {
    return { alreadyDeleted: true };
  }

  const userObjectId = user._id;

  await Promise.all([
    Attempt.deleteMany({ userId: userObjectId }),
    PlannerSession.deleteMany({ userId: userObjectId }),
    Notification.deleteMany({ userId: userObjectId }),
    FocusLog.deleteMany({ userId: userObjectId }),
    PhysicalLog.deleteMany({ userId: userObjectId }),
    Badge.deleteMany({ userId: userObjectId }),
    FlashcardReview.deleteMany({ userId: userObjectId }),
    TopicMastery.deleteMany({ userId: userObjectId }),
    CourseProgress.deleteMany({ userId: userObjectId }),
    DoubtPost.deleteMany({ userId: userObjectId }),
    LiveClassReminder.deleteMany({ userId: userObjectId }),
    MentorBooking.deleteMany({ studentId: userObjectId }),
    ExperimentAssignment.deleteMany({ userId: userObjectId }),
    ExperimentEvent.deleteMany({ userId: userObjectId }),
    DailyQuotaUsage.deleteMany({ userId: userObjectId }),
    AiDailyUsage.deleteMany({ userId: userObjectId }),
    AiCallLog.deleteMany({ userId: userObjectId }),
    AiDoubtCache.deleteMany({ userId: userObjectId }),
    AiDoubtAnswer.deleteMany({ userId: userObjectId }),
    AiModelFeedback.deleteMany({ userId: userObjectId }),
    StudentProfile.deleteOne({ userId: userObjectId }),
    Referral.deleteMany({ $or: [{ referrerId: userObjectId }, { refereeId: userObjectId }] }),
    SubscriptionEntitlement.deleteMany({ userId: userObjectId }),
  ]);

  await GroupChatMessage.updateMany(
    { userId: userObjectId },
    { $set: { userName: 'Deleted user', text: '[message removed]' } },
  );

  await StudyGroup.updateMany({ members: userObjectId }, { $pull: { members: userObjectId } });

  await revokeAllUserRefreshTokens(String(userObjectId));

  user.name = 'Deleted user';
  user.email = undefined;
  user.phone = `+919${String(userObjectId).slice(-9).padStart(9, '0')}`;
  user.passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 4);
  user.expoPushToken = null;
  user.expoPushPlatform = undefined;
  user.referralCode = undefined;
  user.isPremium = false;
  user.premiumPlan = null;
  user.premiumExpiresAt = null;
  user.coins = 0;
  user.streak = {
    count: 0,
    lastActiveDate: null,
    current: 0,
    best: 0,
    freezes: 0,
    lastActiveOn: null,
  };
  user.notificationPreferences = undefined;
  user.pushNotificationsEnabled = false;
  user.currentAffairsAlertsEnabled = false;
  user.privacyConsent = {
    policyVersion: user.privacyConsent?.policyVersion ?? privacyConfig.policyVersion,
    acceptedAt: user.privacyConsent?.acceptedAt ?? null,
    aiProcessing: false,
    marketing: false,
  };
  user.accountStatus = 'deleted';
  user.deletedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  await user.save();

  logger.info('user account erased', { userId: String(userObjectId) });

  return { userId: String(userObjectId), deletedAt: user.deletedAt };
}
