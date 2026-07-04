import * as adminStatsService from '../services/admin/adminStatsService.js';
import * as adminTestModerationService from '../services/admin/adminTestModerationService.js';
import * as adminCrudService from '../services/admin/adminCrudService.js';
import * as adminQuestionService from '../services/admin/adminQuestionService.js';
import { questionImportBodySchema } from '../validators/questionImportValidators.js';
import { AppError } from '../utils/AppError.js';
import { generateMultiSectionExam } from '../services/ai/testGenerator.js';
import * as aiFeedbackService from '../services/ai/aiFeedbackService.js';
import * as adminStudentService from '../services/admin/adminStudentService.js';
import * as adminRevenueService from '../services/admin/adminRevenueService.js';
import * as adminEngagementService from '../services/admin/adminEngagementService.js';
import * as teamService from '../services/admin/teamService.js';
import * as adminNotificationService from '../services/admin/adminNotificationService.js';
import * as bannerService from '../services/bannerService.js';
import * as couponService from '../services/couponService.js';
import * as adminReportsService from '../services/admin/adminReportsService.js';
import * as adminCurrentAffairAiService from '../services/admin/adminCurrentAffairAiService.js';
import * as adminMediaService from '../services/admin/adminMediaService.js';
import * as adminMentorService from '../services/admin/adminMentorService.js';
import * as liveClassService from '../services/liveClassService.js';
import { verifyMediaUploadToken } from '../services/media/mediaObjectStorage.js';
import { getValidatedQuery } from '../middleware/validate.js';
import { listPublicPlans } from '../config/premiumPlans.js';
import * as platformSettingsService from '../services/platformSettingsService.js';

export async function getStats(_req, res) {
  const result = await adminStatsService.getAdminStats();
  res.status(200).json(result);
}

export async function getAttemptsStats(req, res) {
  const days = Number(req.query.days) || 14;
  const result = await adminReportsService.getAttemptsSeries(days);
  res.status(200).json(result);
}

export async function listPendingTests(req, res) {
  const result = await adminTestModerationService.listPendingTests(getValidatedQuery(req));
  res.status(200).json(result);
}

export async function reviewTest(req, res) {
  const decision = req.body.action ?? req.body.decision;
  const result = await adminTestModerationService.reviewTest(req.params.id, decision);
  res.status(200).json(result);
}

function normalizeGenerateExamBody(body) {
  const examTag = body.exam ?? body.examTag;
  const defaultCount = body.count ?? 10;
  const sections = body.sections?.length
    ? body.sections.map((section) => ({
        ...section,
        count: section.count ?? defaultCount,
      }))
    : [
        { subject: 'Quantitative Aptitude', topic: 'Mixed', count: defaultCount },
        { subject: 'English', topic: 'Mixed', count: defaultCount },
        { subject: 'General Intelligence', topic: 'Mixed', count: defaultCount },
      ];

  return {
    title: body.title ?? `${examTag} Full Mock · AI`,
    examTag,
    language: body.language ?? 'en',
    difficulty: body.difficulty ?? 'medium',
    sections,
  };
}

export async function generateExam(req, res) {
  const payload = normalizeGenerateExamBody(req.body);
  const result = await generateMultiSectionExam({
    ...payload,
    userId: req.user._id,
  });

  res.status(201).json({
    ...result,
    test: adminTestModerationService.formatPendingTest(result.test.toObject()),
  });
}

export async function listQuestions(req, res) {
  res.status(200).json(await adminQuestionService.listQuestions(getValidatedQuery(req)));
}

export async function listReviewQueue(req, res) {
  res.status(200).json(await adminQuestionService.listReviewQueue(getValidatedQuery(req)));
}

export async function getQuestion(req, res) {
  res.status(200).json(await adminQuestionService.getQuestionById(req.params.id));
}

export async function createQuestion(req, res) {
  res.status(201).json(await adminQuestionService.createQuestion(req.user._id, req.body));
}

export async function updateQuestion(req, res) {
  res.status(200).json(await adminQuestionService.updateQuestion(req.user._id, req.params.id, req.body));
}

export async function deleteQuestion(req, res) {
  res.status(200).json(await adminQuestionService.deleteQuestion(req.params.id));
}

export async function setQuestionStatus(req, res) {
  res.status(200).json(
    await adminQuestionService.setQuestionStatus(req.user._id, req.params.id, req.body.status),
  );
}

export async function reviewQuestion(req, res) {
  res.status(200).json(
    await adminQuestionService.reviewQuestion(req.user._id, req.params.id, req.body),
  );
}

export async function mergeQuestion(req, res) {
  res.status(200).json(
    await adminQuestionService.mergeQuestion(req.user._id, req.params.id, req.body.into),
  );
}

export async function importQuestions(req, res) {
  if (!req.file && req.body?.questions) {
    const parsed = questionImportBodySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((issue) => issue.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }
  }

  const result = await adminQuestionService.importQuestions(req.user._id, {
    file: req.file,
    body: req.body,
  });
  res.status(201).json(result);
}

export async function listExams(req, res) {
  res.status(200).json(await adminCrudService.examAdmin.list(getValidatedQuery(req)));
}

export async function getExam(req, res) {
  res.status(200).json(await adminCrudService.examAdmin.getById(req.params.id));
}

export async function createExam(req, res) {
  const result = await adminCrudService.examAdmin.create(
    {
      ...req.body,
      code: req.body.code.toUpperCase(),
    },
    req.user._id,
  );
  res.status(201).json(result);
}

export async function updateExam(req, res) {
  const updates = { ...req.body };

  if (updates.code) {
    updates.code = updates.code.toUpperCase();
  }

  res.status(200).json(await adminCrudService.examAdmin.update(req.params.id, updates, req.user._id));
}

export async function setExamStatus(req, res) {
  res.status(200).json(
    await adminCrudService.examAdmin.setStatus(req.params.id, req.body.status, req.user._id),
  );
}

export async function deleteExam(req, res) {
  res.status(200).json(await adminCrudService.examAdmin.remove(req.params.id));
}

export async function listCourses(req, res) {
  res.status(200).json(await adminCrudService.courseAdmin.list(getValidatedQuery(req)));
}

export async function getCourse(req, res) {
  res.status(200).json(await adminCrudService.courseAdmin.getById(req.params.id));
}

export async function createCourse(req, res) {
  res.status(201).json(await adminCrudService.courseAdmin.create(req.body, req.user._id));
}

export async function updateCourse(req, res) {
  res.status(200).json(await adminCrudService.courseAdmin.update(req.params.id, req.body, req.user._id));
}

export async function setCourseStatus(req, res) {
  res.status(200).json(
    await adminCrudService.courseAdmin.setStatus(req.params.id, req.body.status, req.user._id),
  );
}

export async function deleteCourse(req, res) {
  res.status(200).json(await adminCrudService.courseAdmin.remove(req.params.id));
}

export async function listCurrentAffairs(req, res) {
  res.status(200).json(await adminCrudService.currentAffairAdmin.list(getValidatedQuery(req)));
}

export async function getCurrentAffair(req, res) {
  res.status(200).json(await adminCrudService.currentAffairAdmin.getById(req.params.id));
}

export async function createCurrentAffair(req, res) {
  const result = await adminCrudService.currentAffairAdmin.create(req.body, req.user._id);

  if (result.status === 'published' || !result.status) {
    const { dispatchNotificationToMatchingStudents, NOTIFICATION_TYPES } = await import(
      '../services/notificationService.js'
    );
    await dispatchNotificationToMatchingStudents({}, {
      type: NOTIFICATION_TYPES.NEW_CURRENT_AFFAIRS,
      title: 'New current affairs',
      body: result.title,
      data: { affairId: result._id.toString() },
    });
  }

  res.status(201).json(result);
}

export async function updateCurrentAffair(req, res) {
  res.status(200).json(
    await adminCrudService.currentAffairAdmin.update(req.params.id, req.body, req.user._id),
  );
}

export async function setCurrentAffairStatus(req, res) {
  res.status(200).json(
    await adminCrudService.currentAffairAdmin.setStatus(req.params.id, req.body.status, req.user._id),
  );
}

export async function deleteCurrentAffair(req, res) {
  res.status(200).json(await adminCrudService.currentAffairAdmin.remove(req.params.id));
}

export async function generateCurrentAffairAi(req, res) {
  const result = await adminCurrentAffairAiService.enrichCurrentAffairWithAi(
    req.params.id,
    req.user._id,
  );
  res.status(200).json(result);
}

export async function listMentors(req, res) {
  res.status(200).json(await adminMentorService.listMentors(getValidatedQuery(req)));
}

export async function getMentor(req, res) {
  const mentor = await adminMentorService.getMentorById(req.params.id);
  if (!mentor) {
    throw new AppError('Mentor not found', 404, 'NOT_FOUND');
  }
  res.status(200).json(mentor);
}

export async function createMentor(req, res) {
  res.status(201).json(await adminMentorService.createMentor(req.body));
}

export async function updateMentor(req, res) {
  res.status(200).json(await adminMentorService.updateMentor(req.params.id, req.body));
}

export async function setMentorStatus(req, res) {
  res.status(200).json(
    await adminMentorService.setMentorActive(req.params.id, req.body.isActive),
  );
}

export async function listAiFeedback(req, res) {
  const result = await aiFeedbackService.listAiFeedback(getValidatedQuery(req));
  res.status(200).json(result);
}

export async function reviewAiFeedback(req, res) {
  const result = await aiFeedbackService.reviewAiFeedback(
    req.params.id,
    req.body,
    req.user._id,
  );
  res.status(200).json(result);
}

export async function listStudents(req, res) {
  res.status(200).json(await adminStudentService.listStudents(getValidatedQuery(req)));
}

export async function getStudent(req, res) {
  const student = await adminStudentService.getStudentById(req.params.id);

  if (!student) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  res.status(200).json(student);
}

export async function setStudentStatus(req, res) {
  res.status(200).json(
    await adminStudentService.setStudentStatus(req.params.id, req.body.status),
  );
}

export async function exportStudents(req, res) {
  const csv = await adminStudentService.exportStudentsCsv(getValidatedQuery(req));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.status(200).send(csv);
}

export async function getReports(_req, res) {
  res.status(200).json(await adminReportsService.getAdminReports());
}

export async function getReferrals(_req, res) {
  res.status(200).json(await adminReportsService.getReferralSummary());
}

export async function getBillingPlans(_req, res) {
  res.status(200).json({ plans: listPublicPlans() });
}

export async function getPlatformSettings(_req, res) {
  res.status(200).json(await platformSettingsService.getAdminPlatformSettings());
}

export async function updatePlatformSettings(req, res) {
  res.status(200).json(await platformSettingsService.updatePlatformSettings(req.body));
}

export async function createAdminLiveClass(req, res) {
  const result = await liveClassService.createLiveClass(req.user._id, req.body);
  res.status(201).json(result);
}

export async function updateAdminLiveClassStatus(req, res) {
  const result = await liveClassService.updateLiveClassStatus(
    req.user._id,
    req.params.id,
    req.body.status,
  );
  res.status(200).json(result);
}

export async function patchAdminLiveClass(req, res) {
  res.status(200).json(await liveClassService.patchAdminLiveClass(req.user._id, req.params.id, req.body));
}

export async function startAdminLiveClass(req, res) {
  res.status(200).json(await liveClassService.startLiveClass(req.user._id, req.params.id));
}

export async function endAdminLiveClass(req, res) {
  res.status(200).json(await liveClassService.endLiveClass(req.user._id, req.params.id));
}

export async function patchAdminLiveClassRecording(req, res) {
  res.status(200).json(
    await liveClassService.setRecordingPublished(req.user._id, req.params.id, req.body.published),
  );
}

export async function getRevenueSummary(req, res) {
  res.status(200).json(await adminRevenueService.getRevenueSummary());
}

export async function listTransactions(req, res) {
  res.status(200).json(await adminRevenueService.listTransactions(getValidatedQuery(req)));
}

export async function refundTransaction(req, res) {
  res.status(200).json(await adminRevenueService.refundTransaction(req.params.id));
}

export async function remindTransaction(req, res) {
  res.status(200).json(await adminRevenueService.remindTransaction(req.params.id));
}

/** @deprecated use listTransactions */
export async function listPayments(req, res) {
  res.status(200).json(await adminRevenueService.listTransactions(getValidatedQuery(req)));
}

export async function broadcastNotification(req, res) {
  res.status(201).json(await adminEngagementService.broadcastNotification(req.body));
}

export async function publishAnnouncement(req, res) {
  res.status(201).json(await adminEngagementService.publishAnnouncement(req.body));
}

export async function listRecentBroadcasts(req, res) {
  res.status(200).json(await adminEngagementService.listRecentBroadcasts(getValidatedQuery(req)));
}

export async function createAdminNotification(req, res) {
  res.status(201).json(
    await adminNotificationService.createAdminNotification(req.user._id, req.body),
  );
}

export async function listAdminNotifications(req, res) {
  res.status(200).json(await adminNotificationService.listAdminNotifications(getValidatedQuery(req)));
}

export async function getAdminNotificationAudienceCount(req, res) {
  const { audience, exam } = getValidatedQuery(req);
  const count = await adminNotificationService.countAudienceMembers(audience, exam);
  res.status(200).json({ audience, exam: exam ?? null, count });
}

export async function listAdminBanners(req, res) {
  res.status(200).json(await bannerService.listAdminBanners(getValidatedQuery(req)));
}

export async function getAdminBanner(req, res) {
  res.status(200).json(await bannerService.getAdminBannerById(req.params.id));
}

export async function createAdminBanner(req, res) {
  res.status(201).json(await bannerService.createAdminBanner(req.user._id, req.body));
}

export async function updateAdminBanner(req, res) {
  res.status(200).json(await bannerService.updateAdminBanner(req.params.id, req.body));
}

export async function setAdminBannerActive(req, res) {
  res.status(200).json(await bannerService.setAdminBannerActive(req.params.id, req.body.active));
}

export async function deleteAdminBanner(req, res) {
  res.status(200).json(await bannerService.deleteAdminBanner(req.params.id));
}

export async function listAdminCoupons(req, res) {
  res.status(200).json(await couponService.listAdminCoupons(getValidatedQuery(req)));
}

export async function getAdminCoupon(req, res) {
  res.status(200).json(await couponService.getAdminCouponById(req.params.id));
}

export async function createAdminCoupon(req, res) {
  res.status(201).json(await couponService.createAdminCoupon(req.user._id, req.body));
}

export async function updateAdminCoupon(req, res) {
  res.status(200).json(await couponService.updateAdminCoupon(req.params.id, req.body));
}

export async function setAdminCouponActive(req, res) {
  res.status(200).json(await couponService.setAdminCouponActive(req.params.id, req.body.active));
}

export async function deleteAdminCoupon(req, res) {
  res.status(200).json(await couponService.deleteAdminCoupon(req.params.id));
}

export async function listTeamMembers(_req, res) {
  res.status(200).json(await teamService.listTeamMembers());
}

export async function inviteTeamMember(req, res) {
  res.status(201).json(
    await teamService.inviteTeamMember({
      email: req.body.email,
      role: req.body.role,
      invitedBy: req.user._id,
    }),
  );
}

export async function updateTeamMemberRole(req, res) {
  res.status(200).json(
    await teamService.updateTeamMemberRole({
      memberId: req.params.id,
      role: req.body.role,
      actorId: req.user._id,
    }),
  );
}

export async function removeTeamMember(req, res) {
  res.status(200).json(
    await teamService.removeTeamMember({
      memberId: req.params.id,
      actorId: req.user._id,
    }),
  );
}

export async function listMediaAssets(req, res) {
  res.status(200).json(await adminMediaService.listMedia(getValidatedQuery(req)));
}

export async function postMedia(req, res) {
  if (req.body.action === 'presign') {
    const result = await adminMediaService.presignMediaUpload(req.user._id, req.body);
    res.status(200).json(result);
    return;
  }

  const result = await adminMediaService.completeMediaUpload(req.user._id, req.body);
  res.status(201).json(result);
}

export async function uploadMediaDirect(req, res) {
  const token = req.body?.uploadToken?.trim?.() ?? String(req.body?.uploadToken ?? '').trim();
  if (!token) {
    throw new AppError('uploadToken is required', 400, 'VALIDATION_ERROR');
  }

  const tokenPayload = verifyMediaUploadToken(token);
  const result = await adminMediaService.uploadMediaDirect(req.user._id, {
    tokenPayload,
    buffer: req.file?.buffer,
  });
  res.status(201).json(result);
}

export async function deleteMediaAsset(req, res) {
  res.status(200).json(await adminMediaService.removeMedia(req.params.id));
}

export async function listAdminLiveClasses(req, res) {
  res.status(200).json(await liveClassService.listAdminLiveClasses(getValidatedQuery(req)));
}

export async function listAuditLogs(req, res) {
  const { listAuditLogs: listLogs } = await import('../services/auditService.js');
  const limit = Number(req.query.limit) || 50;
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
  res.status(200).json(await listLogs({ limit, cursor }));
}

export async function recordAuditTest(_req, res) {
  res.status(200).json({ ok: true, message: 'Test audit action recorded' });
}
