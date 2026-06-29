import { Router } from 'express';
import { getHome, refreshHome } from '../controllers/homeController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cacheHeaders } from '../middleware/cacheHeaders.js';

const router = Router();

router.get('/', requireAuth, cacheHeaders('homeFeed'), asyncHandler(getHome));
router.post('/refresh', requireAuth, asyncHandler(refreshHome));

/** @deprecated Prefer GET /api/home */
router.get('/feed', requireAuth, cacheHeaders('homeFeed'), asyncHandler(getHome));

export default router;
