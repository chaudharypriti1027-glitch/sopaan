import { Router } from 'express';
import { getVersionRequirements } from '../controllers/mobileAppController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/version-requirements', asyncHandler(getVersionRequirements));

export default router;
