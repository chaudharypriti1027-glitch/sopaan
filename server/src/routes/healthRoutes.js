import { Router } from 'express';
import { getHealth, sentryTest } from '../controllers/healthController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/health', asyncHandler(getHealth));
router.get('/health/sentry-test', asyncHandler(sentryTest));

export default router;
