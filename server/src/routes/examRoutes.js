import { Router } from 'express';
import * as examController from '../controllers/examController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate, validateParams } from '../middleware/validate.js';
import { cacheHeaders } from '../middleware/cacheHeaders.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.get(
  '/calendar',
  cacheHeaders('examCalendar'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(examController.getCalendar),
);
router.get(
  '/',
  cacheHeaders('examList'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(examController.listExams),
);
router.get('/:id', validateParams(objectIdParamsSchema), asyncHandler(examController.getExam));

export default router;
