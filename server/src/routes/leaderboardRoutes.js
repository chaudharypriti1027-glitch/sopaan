import { Router } from 'express';
import { z } from 'zod';
import * as leaderboardController from '../controllers/leaderboardController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { cacheHeaders } from '../middleware/cacheHeaders.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';

const leaderboardQuerySchema = paginationQuerySchema.extend({
  period: z.enum(['daily', 'weekly', 'all-time']).optional(),
});

const router = Router();

router.use(requireAuth);
router.get(
  '/',
  cacheHeaders('leaderboard'),
  validate(leaderboardQuerySchema, 'query'),
  asyncHandler(leaderboardController.getLeaderboard),
);

export default router;
