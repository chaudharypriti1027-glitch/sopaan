import { User } from '../../models/User.js';
import { Test } from '../../models/Test.js';
import { Attempt } from '../../models/Attempt.js';
import { FocusLog } from '../../models/FocusLog.js';
import { Course } from '../../models/Course.js';
import { Exam } from '../../models/Exam.js';
import { Question } from '../../models/Question.js';
import { CurrentAffair } from '../../models/CurrentAffair.js';
import { Mentor } from '../../models/Mentor.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { countPendingQuestionReviews } from './adminQuestionService.js';
import { countActiveLiveClasses } from '../liveClassService.js';
import { getAdminReports } from './adminReportsService.js';

export async function getAdminStats() {
  const since = subtractDays(new Date(), 30);

  const [
    activeAttemptUsers,
    activeFocusUsers,
    testsPublished,
    liveClasses,
    pendingReviews,
    pendingQuestionReviews,
    totalStudents,
    coursesPublished,
    examsTotal,
    questionsTotal,
    currentAffairsPublished,
    mentorsTotal,
    attemptsLast30Days,
    reports,
    questionsPublished,
  ] = await Promise.all([
    Attempt.distinct('userId', { createdAt: { $gte: since } }),
    FocusLog.distinct('userId', { date: { $gte: since } }),
    Test.countDocuments({ status: 'published' }),
    countActiveLiveClasses(),
    Test.countDocuments({ status: 'pending_review' }),
    countPendingQuestionReviews(),
    User.countDocuments({ role: 'student' }),
    Course.countDocuments({ status: 'published' }),
    Exam.countDocuments(),
    Question.countDocuments(),
    CurrentAffair.countDocuments({ status: 'published' }),
    Mentor.countDocuments(),
    Attempt.countDocuments({ createdAt: { $gte: since } }),
    getAdminReports(),
    Question.countDocuments({ status: 'published' }),
  ]);

  const activeIds = new Set([
    ...activeAttemptUsers.map((id) => id.toString()),
    ...activeFocusUsers.map((id) => id.toString()),
  ]);

  const activeStudents = await User.countDocuments({
    role: 'student',
    _id: { $in: [...activeIds] },
  });

  return {
    activeStudents,
    totalStudents,
    testsPublished,
    liveClasses,
    pendingReviews,
    pendingQuestionReviews,
    coursesPublished,
    examsTotal,
    questionsTotal,
    questionsPublished,
    currentAffairsPublished,
    mentorsTotal,
    attemptsLast30Days,
    proStudents: reports.proStudents,
    signupsLast30Days: reports.signupsLast30Days,
    aiFeedbackPending: reports.aiFeedbackPending,
    mrrPaise: reports.revenue.mrrPaise,
    revenue30dPaise: reports.revenue.revenue30dPaise,
    activeSubscriptions: reports.revenue.activeSubscriptions,
    refunds30d: reports.revenue.refunds30d,
    attemptsDaily: reports.attemptsDaily,
    signupsDaily: reports.signupsDaily,
    referralsTotal: reports.referrals.total,
    referralsConverted: reports.referrals.converted,
    assessedAt: new Date().toISOString(),
  };
}
