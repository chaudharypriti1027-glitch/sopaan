import { Router } from 'express';
import * as rewardController from '../controllers/rewardController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(rewardController.listBadges));

export default router;
