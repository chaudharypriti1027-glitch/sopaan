import { Router } from 'express';
import * as mentorController from '../controllers/mentorController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { mentorBookSchema, paginationQuerySchema } from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(mentorController.listMentors));
router.get('/:id', asyncHandler(mentorController.getMentor));
router.post('/:id/book', validate(mentorBookSchema), asyncHandler(mentorController.bookMentor));

export default router;
