import { Router } from 'express';
import * as currentAffairController from '../controllers/currentAffairController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { cacheHeaders } from '../middleware/cacheHeaders.js';
import { currentAffairsQuerySchema, digestDateQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.get(
  '/digest/today',
  cacheHeaders('caDigest'),
  validate(digestDateQuerySchema, 'query'),
  asyncHandler(currentAffairController.getTodayDigest),
);
router.get(
  '/digest',
  cacheHeaders('caDigest'),
  validate(digestDateQuerySchema, 'query'),
  asyncHandler(currentAffairController.getDigestByDate),
);
router.get(
  '/',
  cacheHeaders('currentAffairsList'),
  validate(currentAffairsQuerySchema, 'query'),
  asyncHandler(currentAffairController.listCurrentAffairs)
);
router.get('/:id', asyncHandler(currentAffairController.getCurrentAffair));

export default router;
