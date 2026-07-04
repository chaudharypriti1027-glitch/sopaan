import { Router } from 'express';
import * as bannerController from '../controllers/bannerController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(bannerController.getActiveBanner));

export default router;
