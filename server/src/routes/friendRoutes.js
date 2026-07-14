import { Router } from 'express';
import { z } from 'zod';
import * as friendController from '../controllers/friendController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { paginationQuerySchema } from '../validators/featureValidators.js';
import {
  friendRequestSchema,
  friendRespondSchema,
  friendSearchQuerySchema,
} from '../validators/friendValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/search', validate(friendSearchQuerySchema, 'query'), asyncHandler(friendController.searchStudents));
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(friendController.listFriends));
router.get(
  '/requests',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(friendController.listFriendRequests),
);
router.post('/', validate(friendRequestSchema), asyncHandler(friendController.sendFriendRequest));
router.post(
  '/requests/:id/respond',
  validateParams(objectIdParamsSchema),
  validate(friendRespondSchema),
  asyncHandler(friendController.respondFriendRequest),
);
router.delete(
  '/:userId',
  validateParams(z.object({ userId: z.string().trim().min(1) })),
  asyncHandler(friendController.removeFriend),
);

export default router;
