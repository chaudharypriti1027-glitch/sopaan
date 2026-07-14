import { Router } from 'express';
import * as conversationController from '../controllers/conversationController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { paginationQuerySchema } from '../validators/featureValidators.js';
import { conversationCreateSchema } from '../validators/friendValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(conversationController.listConversations));
router.post('/', validate(conversationCreateSchema), asyncHandler(conversationController.getOrCreateConversation));
router.get(
  '/:id/messages',
  validateParams(objectIdParamsSchema),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(conversationController.listConversationMessages),
);

export default router;
