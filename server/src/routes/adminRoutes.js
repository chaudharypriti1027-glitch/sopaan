import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as jobAdminController from '../controllers/jobAdminController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { adminOnly, staffOnly } from '../middleware/adminRbac.js';
import { auditAdminMutations } from '../middleware/auditAdminMutations.js';
import { validate } from '../middleware/validate.js';
import { optionalImportUpload } from '../middleware/importUpload.js';
import { mediaDirectUpload, handleMediaUploadError } from '../middleware/mediaUpload.js';
import {
  reviewTestSchema,
  generateExamSchema,
  examCreateSchema,
  courseCreateSchema,
  currentAffairCreateSchema,
  mentorCreateSchema,
  mentorUpdateSchema,
  mentorStatusSchema,
  adminMentorQuerySchema,
  paginationQuerySchema,
  aiFeedbackQuerySchema,
  aiFeedbackReviewSchema,
  adminContentQuerySchema,
  publishStatusSchema,
  questionReviewSchema,
  questionMergeSchema,
  jobRunsQuerySchema,
  triggerJobSchema,
  adminBroadcastSchema,
  adminNotificationCreateSchema,
  adminNotificationAudienceQuerySchema,
  adminAnnouncementSchema,
  bannerCreateSchema,
  bannerUpdateSchema,
  bannerActiveSchema,
  couponCreateSchema,
  couponUpdateSchema,
  couponActiveSchema,
  teamInviteSchema,
  teamRoleUpdateSchema,
  platformSettingsUpdateSchema,
  adminStudentQuerySchema,
  studentStatusSchema,
  mediaPostSchema,
  mediaQuerySchema,
  adminResourceParamsSchema,
  adminJobNameParamsSchema,
  emptyMutationBodySchema,
} from '../validators/adminValidators.js';
import {
  questionCreateSchema,
  questionUpdateSchema,
} from '../validators/questionImportValidators.js';
import {
  liveClassCreateSchema,
  liveClassStatusSchema,
  liveClassUpdateSchema,
  liveClassRecordingPublishSchema,
  adminLiveClassQuerySchema,
} from '../validators/liveClassValidators.js';

const router = Router();
const validateId = validate(adminResourceParamsSchema, 'params');
const validateJobName = validate(adminJobNameParamsSchema, 'params');
const validateEmptyBody = validate(emptyMutationBodySchema);

router.use(requireAuth, staffOnly);
router.use(auditAdminMutations);

router.get('/stats/attempts', asyncHandler(adminController.getAttemptsStats));
router.get('/stats', asyncHandler(adminController.getStats));

router.get(
  '/tests/pending',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listPendingTests),
);
router.post(
  '/tests/:id/review',
  validate(reviewTestSchema),
  asyncHandler(adminController.reviewTest),
);

router.post(
  '/generate-exam',
  validate(generateExamSchema),
  asyncHandler(adminController.generateExam),
);

router.get(
  '/questions',
  validate(adminContentQuerySchema, 'query'),
  asyncHandler(adminController.listQuestions),
);
router.get(
  '/questions/review-queue',
  validate(adminContentQuerySchema, 'query'),
  asyncHandler(adminController.listReviewQueue),
);
router.get('/questions/:id', asyncHandler(adminController.getQuestion));
router.post('/questions', validate(questionCreateSchema), asyncHandler(adminController.createQuestion));
router.put(
  '/questions/:id',
  validate(questionUpdateSchema),
  asyncHandler(adminController.updateQuestion),
);
router.patch(
  '/questions/:id/status',
  validate(publishStatusSchema),
  asyncHandler(adminController.setQuestionStatus),
);
router.post(
  '/questions/:id/review',
  validate(questionReviewSchema),
  asyncHandler(adminController.reviewQuestion),
);
router.post(
  '/questions/:id/merge',
  validate(questionMergeSchema),
  asyncHandler(adminController.mergeQuestion),
);
router.delete('/questions/:id', validateId, asyncHandler(adminController.deleteQuestion));
router.post(
  '/questions/import',
  optionalImportUpload,
  asyncHandler(adminController.importQuestions),
);

router.get('/exams', validate(adminContentQuerySchema, 'query'), asyncHandler(adminController.listExams));
router.get('/exams/:id', asyncHandler(adminController.getExam));
router.post('/exams', validate(examCreateSchema), asyncHandler(adminController.createExam));
router.put('/exams/:id', asyncHandler(adminController.updateExam));
router.patch(
  '/exams/:id/status',
  validate(publishStatusSchema),
  asyncHandler(adminController.setExamStatus),
);
router.delete('/exams/:id', validateId, asyncHandler(adminController.deleteExam));

router.get('/courses', validate(adminContentQuerySchema, 'query'), asyncHandler(adminController.listCourses));
router.get('/courses/:id', asyncHandler(adminController.getCourse));
router.post('/courses', validate(courseCreateSchema), asyncHandler(adminController.createCourse));
router.put('/courses/:id', asyncHandler(adminController.updateCourse));
router.patch(
  '/courses/:id/status',
  validate(publishStatusSchema),
  asyncHandler(adminController.setCourseStatus),
);
router.delete('/courses/:id', validateId, asyncHandler(adminController.deleteCourse));

router.get(
  '/current-affairs',
  validate(adminContentQuerySchema, 'query'),
  asyncHandler(adminController.listCurrentAffairs),
);
router.get('/current-affairs/:id', asyncHandler(adminController.getCurrentAffair));
router.post(
  '/current-affairs',
  validate(currentAffairCreateSchema),
  asyncHandler(adminController.createCurrentAffair),
);
router.put('/current-affairs/:id', asyncHandler(adminController.updateCurrentAffair));
router.patch(
  '/current-affairs/:id/status',
  validate(publishStatusSchema),
  asyncHandler(adminController.setCurrentAffairStatus),
);
router.delete('/current-affairs/:id', validateId, asyncHandler(adminController.deleteCurrentAffair));
router.post('/current-affairs/:id/ai', validateId, validateEmptyBody, asyncHandler(adminController.generateCurrentAffairAi));

router.get('/mentors', validate(adminMentorQuerySchema, 'query'), asyncHandler(adminController.listMentors));
router.get('/mentors/:id', asyncHandler(adminController.getMentor));
router.post('/mentors', validate(mentorCreateSchema), asyncHandler(adminController.createMentor));
router.put('/mentors/:id', validate(mentorUpdateSchema), asyncHandler(adminController.updateMentor));
router.patch(
  '/mentors/:id/status',
  validate(mentorStatusSchema),
  asyncHandler(adminController.setMentorStatus),
);

router.get(
  '/ai-feedback',
  adminOnly,
  validate(aiFeedbackQuerySchema, 'query'),
  asyncHandler(adminController.listAiFeedback),
);
router.patch(
  '/ai-feedback/:id',
  adminOnly,
  validate(aiFeedbackReviewSchema),
  asyncHandler(adminController.reviewAiFeedback),
);

router.get('/jobs', adminOnly, asyncHandler(jobAdminController.listJobs));
router.get(
  '/jobs/runs',
  adminOnly,
  validate(jobRunsQuerySchema, 'query'),
  asyncHandler(jobAdminController.listJobRuns),
);
router.get('/jobs/runs/:id', adminOnly, asyncHandler(jobAdminController.getJobRun));
router.post(
  '/jobs/:jobName/run',
  adminOnly,
  validateJobName,
  validate(triggerJobSchema),
  asyncHandler(jobAdminController.runJobNow),
);

router.get(
  '/students/export',
  validate(adminStudentQuerySchema, 'query'),
  asyncHandler(adminController.exportStudents),
);
router.get(
  '/students',
  validate(adminStudentQuerySchema, 'query'),
  asyncHandler(adminController.listStudents),
);
router.get('/students/:id', asyncHandler(adminController.getStudent));
router.patch(
  '/students/:id/status',
  validate(studentStatusSchema),
  asyncHandler(adminController.setStudentStatus),
);

router.get('/reports', adminOnly, asyncHandler(adminController.getReports));
router.get('/referrals', adminOnly, asyncHandler(adminController.getReferrals));
router.get('/billing-plans', adminOnly, asyncHandler(adminController.getBillingPlans));
router.get('/settings', adminOnly, asyncHandler(adminController.getPlatformSettings));
router.put(
  '/settings',
  adminOnly,
  validate(platformSettingsUpdateSchema),
  asyncHandler(adminController.updatePlatformSettings),
);

router.get('/revenue', adminOnly, asyncHandler(adminController.getRevenueSummary));
router.get(
  '/transactions',
  adminOnly,
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listTransactions),
);
router.post('/transactions/:id/refund', adminOnly, validateId, validateEmptyBody, asyncHandler(adminController.refundTransaction));
router.post('/transactions/:id/remind', adminOnly, validateId, validateEmptyBody, asyncHandler(adminController.remindTransaction));
router.get(
  '/payments',
  adminOnly,
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listPayments),
);

router.post(
  '/notifications/broadcast',
  validate(adminBroadcastSchema),
  asyncHandler(adminController.broadcastNotification),
);
router.post(
  '/notifications',
  validate(adminNotificationCreateSchema),
  asyncHandler(adminController.createAdminNotification),
);
router.get(
  '/notifications',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listAdminNotifications),
);
router.get(
  '/notifications/audience-count',
  validate(adminNotificationAudienceQuerySchema, 'query'),
  asyncHandler(adminController.getAdminNotificationAudienceCount),
);
router.post(
  '/announcements',
  validate(adminAnnouncementSchema),
  asyncHandler(adminController.publishAnnouncement),
);
router.get(
  '/banners',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listAdminBanners),
);
router.post(
  '/banners',
  validate(bannerCreateSchema),
  asyncHandler(adminController.createAdminBanner),
);
router.get('/banners/:id', asyncHandler(adminController.getAdminBanner));
router.patch(
  '/banners/:id',
  validate(bannerUpdateSchema),
  asyncHandler(adminController.updateAdminBanner),
);
router.patch(
  '/banners/:id/active',
  validate(bannerActiveSchema),
  asyncHandler(adminController.setAdminBannerActive),
);
router.delete('/banners/:id', validateId, asyncHandler(adminController.deleteAdminBanner));
router.get(
  '/coupons',
  adminOnly,
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listAdminCoupons),
);
router.post(
  '/coupons',
  adminOnly,
  validate(couponCreateSchema),
  asyncHandler(adminController.createAdminCoupon),
);
router.get('/coupons/:id', adminOnly, asyncHandler(adminController.getAdminCoupon));
router.patch(
  '/coupons/:id',
  adminOnly,
  validate(couponUpdateSchema),
  asyncHandler(adminController.updateAdminCoupon),
);
router.patch(
  '/coupons/:id/active',
  adminOnly,
  validate(couponActiveSchema),
  asyncHandler(adminController.setAdminCouponActive),
);
router.delete('/coupons/:id', adminOnly, validateId, asyncHandler(adminController.deleteAdminCoupon));
router.get(
  '/notifications/recent',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(adminController.listRecentBroadcasts),
);

router.get('/team', adminOnly, asyncHandler(adminController.listTeamMembers));
router.post(
  '/team/invite',
  adminOnly,
  validate(teamInviteSchema),
  asyncHandler(adminController.inviteTeamMember),
);
router.patch(
  '/team/:id/role',
  adminOnly,
  validate(teamRoleUpdateSchema),
  asyncHandler(adminController.updateTeamMemberRole),
);
router.delete('/team/:id', adminOnly, validateId, asyncHandler(adminController.removeTeamMember));
router.get(
  '/media',
  validate(mediaQuerySchema, 'query'),
  asyncHandler(adminController.listMediaAssets),
);
router.post('/media', validate(mediaPostSchema), asyncHandler(adminController.postMedia));
router.post(
  '/media/upload',
  mediaDirectUpload,
  handleMediaUploadError,
  asyncHandler(adminController.uploadMediaDirect),
);
router.delete('/media/:id', validateId, asyncHandler(adminController.deleteMediaAsset));
router.get(
  '/live-classes',
  validate(adminLiveClassQuerySchema, 'query'),
  asyncHandler(adminController.listAdminLiveClasses),
);
router.post(
  '/live-classes',
  validate(liveClassCreateSchema),
  asyncHandler(adminController.createAdminLiveClass),
);
router.patch(
  '/live-classes/:id',
  validate(liveClassUpdateSchema),
  asyncHandler(adminController.patchAdminLiveClass),
);
router.post(
  '/live-classes/:id/start',
  validateId,
  validateEmptyBody,
  asyncHandler(adminController.startAdminLiveClass),
);
router.post(
  '/live-classes/:id/end',
  validateId,
  validateEmptyBody,
  asyncHandler(adminController.endAdminLiveClass),
);
router.patch(
  '/live-classes/:id/recording',
  validate(liveClassRecordingPublishSchema),
  asyncHandler(adminController.patchAdminLiveClassRecording),
);
router.patch(
  '/live-classes/:id/status',
  validate(liveClassStatusSchema),
  asyncHandler(adminController.updateAdminLiveClassStatus),
);

router.get('/audit-logs', adminOnly, asyncHandler(adminController.listAuditLogs));
router.post('/audit/test', adminOnly, validateEmptyBody, asyncHandler(adminController.recordAuditTest));

export default router;
