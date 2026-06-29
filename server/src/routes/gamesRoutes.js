import { Router } from 'express';
import * as gamesController from '../controllers/gamesController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { gameCompleteSchema } from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);
router.post('/complete', validate(gameCompleteSchema), asyncHandler(gamesController.completeGame));

export default router;
