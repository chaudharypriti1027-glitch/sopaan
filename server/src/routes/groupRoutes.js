import { Router } from 'express';
import * as groupController from '../controllers/groupController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { groupCreateSchema, paginationQuerySchema } from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(groupController.listGroups));
router.post('/', validate(groupCreateSchema), asyncHandler(groupController.createGroup));
router.post(
  '/:id/join',
  validateParams(objectIdParamsSchema),
  asyncHandler(groupController.joinGroup),
);

export default router;
