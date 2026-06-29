import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as jobAdminController from '../controllers/jobAdminController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { optionalImportUpload } from '../middleware/importUpload.js';
import {
  reviewTestSchema,
  generateExamSchema,
  examCreateSchema,
  courseCreateSchema,
  currentAffairCreateSchema,
  mentorCreateSchema,
  paginationQuerySchema,
  aiFeedbackQuerySchema,
  aiFeedbackReviewSchema,
  adminContentQuerySchema,
  publishStatusSchema,
  questionReviewSchema,
  jobRunsQuerySchema,
  triggerJobSchema,
} from '../validators/adminValidators.js';
import {
  questionCreateSchema,
  questionUpdateSchema,
} from '../validators/questionImportValidators.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

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
router.delete('/questions/:id', asyncHandler(adminController.deleteQuestion));
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
router.delete('/exams/:id', asyncHandler(adminController.deleteExam));

router.get('/courses', validate(adminContentQuerySchema, 'query'), asyncHandler(adminController.listCourses));
router.get('/courses/:id', asyncHandler(adminController.getCourse));
router.post('/courses', validate(courseCreateSchema), asyncHandler(adminController.createCourse));
router.put('/courses/:id', asyncHandler(adminController.updateCourse));
router.patch(
  '/courses/:id/status',
  validate(publishStatusSchema),
  asyncHandler(adminController.setCourseStatus),
);
router.delete('/courses/:id', asyncHandler(adminController.deleteCourse));

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
router.delete('/current-affairs/:id', asyncHandler(adminController.deleteCurrentAffair));

router.get('/mentors', validate(paginationQuerySchema, 'query'), asyncHandler(adminController.listMentors));
router.get('/mentors/:id', asyncHandler(adminController.getMentor));
router.post('/mentors', validate(mentorCreateSchema), asyncHandler(adminController.createMentor));
router.put('/mentors/:id', asyncHandler(adminController.updateMentor));
router.delete('/mentors/:id', asyncHandler(adminController.deleteMentor));

router.get(
  '/ai-feedback',
  validate(aiFeedbackQuerySchema, 'query'),
  asyncHandler(adminController.listAiFeedback),
);
router.patch(
  '/ai-feedback/:id',
  validate(aiFeedbackReviewSchema),
  asyncHandler(adminController.reviewAiFeedback),
);

router.get('/jobs', asyncHandler(jobAdminController.listJobs));
router.get(
  '/jobs/runs',
  validate(jobRunsQuerySchema, 'query'),
  asyncHandler(jobAdminController.listJobRuns),
);
router.get('/jobs/runs/:id', asyncHandler(jobAdminController.getJobRun));
router.post(
  '/jobs/:jobName/run',
  validate(triggerJobSchema),
  asyncHandler(jobAdminController.runJobNow),
);

export default router;
