import { Router } from 'express';
import * as profileController from '../controllers/profileController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, updateGoalSchema } from '../validators/profileValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(profileController.getProfile));
router.put('/', validate(updateProfileSchema), asyncHandler(profileController.updateProfile));
router.put('/goal', validate(updateGoalSchema), asyncHandler(profileController.updateGoal));
router.get('/goal', asyncHandler(profileController.getGoal));
router.get('/readiness', asyncHandler(profileController.getReadiness));

export default router;
