import { Router } from 'express';
import * as testSeriesController from '../controllers/testSeriesController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';
import { z } from 'zod';

const router = Router();

const testSeriesQuerySchema = paginationQuerySchema.extend({
  examTag: z.string().trim().min(1).optional(),
});

router.use(requireAuth);

router.get(
  '/',
  validate(testSeriesQuerySchema, 'query'),
  asyncHandler(testSeriesController.listTestSeries)
);
router.get('/:id', asyncHandler(testSeriesController.getTestSeries));
router.post('/:id/enroll', asyncHandler(testSeriesController.enrollTestSeries));

export default router;
