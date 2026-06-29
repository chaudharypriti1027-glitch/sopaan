import { Router } from 'express';
import * as focusController from '../controllers/focusController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { focusLogSchema } from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);
router.post('/log', validate(focusLogSchema), asyncHandler(focusController.logFocus));

export default router;
