import { Router } from 'express';
import { z } from 'zod';
import * as searchController from '../controllers/searchController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { cacheHeaders } from '../middleware/cacheHeaders.js';

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Search query must be at least 2 characters'),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const router = Router();

router.use(requireAuth);
router.get(
  '/',
  cacheHeaders('search'),
  validate(searchQuerySchema, 'query'),
  asyncHandler(searchController.search),
);

export default router;
