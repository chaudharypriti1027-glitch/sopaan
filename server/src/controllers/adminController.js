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
import * as liveClassService from '../services/liveClassService.js';
import { getValidatedQuery } from '../middleware/validate.js';

export async function getStats(_req, res) {
  const result = await adminStatsService.getAdminStats();
  res.status(200).json(result);
}

export async function listPendingTests(req, res) {
  const result = await adminTestModerationService.listPendingTests(getValidatedQuery(req));
  res.status(200).json(result);
}

export async function reviewTest(req, res) {
  const result = await adminTestModerationService.reviewTest(req.params.id, req.body.decision);
  res.status(200).json(result);
}

export async function generateExam(req, res) {
  const result = await generateMultiSectionExam({
    ...req.body,
    userId: req.user._id,
  });
  res.status(201).json(result);
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

export async function listMentors(req, res) {
  res.status(200).json(await adminCrudService.mentorAdmin.list(getValidatedQuery(req)));
}

export async function getMentor(req, res) {
  res.status(200).json(await adminCrudService.mentorAdmin.getById(req.params.id));
}

export async function createMentor(req, res) {
  res.status(201).json(await adminCrudService.mentorAdmin.create(req.body));
}

export async function updateMentor(req, res) {
  res.status(200).json(await adminCrudService.mentorAdmin.update(req.params.id, req.body));
}

export async function deleteMentor(req, res) {
  res.status(200).json(await adminCrudService.mentorAdmin.remove(req.params.id));
}

export async function listAiFeedback(req, res) {
  const result = await aiFeedbackService.listAiFeedback(getValidatedQuery(req));
  res.status(200).json(result);
}

export async function reviewAiFeedback(req, res) {
  const result = await aiFeedbackService.updateAiFeedbackStatus(
    req.params.id,
    req.body,
    req.user._id,
  );
  res.status(200).json(result);
}

export async function listStudents(req, res) {
  res.status(200).json(await adminStudentService.listStudents(getValidatedQuery(req)));
}

export async function getRevenueSummary(req, res) {
  res.status(200).json(await adminRevenueService.getRevenueSummary());
}

export async function listPayments(req, res) {
  res.status(200).json(await adminRevenueService.listRecentPayments(getValidatedQuery(req)));
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

export async function listTeamMembers(_req, res) {
  res.status(200).json(await adminEngagementService.listTeamMembers());
}

export async function listMediaAssets(req, res) {
  res.status(200).json(await adminEngagementService.listMediaAssets(getValidatedQuery(req)));
}

export async function listAdminLiveClasses(req, res) {
  res.status(200).json(await liveClassService.listAdminLiveClasses(getValidatedQuery(req)));
}
