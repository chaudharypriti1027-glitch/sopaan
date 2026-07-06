import { Router } from 'express';
import * as bannerController from '../controllers/bannerController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/** Public — active promo banner is not user-specific. */
router.get('/', asyncHandler(bannerController.getActiveBanner));

export default router;
