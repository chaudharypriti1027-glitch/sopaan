import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validate } from '../middleware/validate.js';
import { courseProgressSchema, paginationQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.get('/', optionalAuth, validate(paginationQuerySchema, 'query'), asyncHandler(courseController.listCourses));
router.get('/:id', optionalAuth, asyncHandler(courseController.getCourse));
router.post(
  '/:id/progress',
  requireAuth,
  validate(courseProgressSchema),
  asyncHandler(courseController.updateProgress)
);

export default router;
