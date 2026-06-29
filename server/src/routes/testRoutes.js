import { Router } from 'express';
import * as testController from '../controllers/testController.js';
import * as communityTestController from '../controllers/communityTestController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { checkQuota } from '../middleware/requirePro.js';
import { validate, validateParams } from '../middleware/validate.js';
import { objectIdParamsSchema } from '../validators/commonValidators.js';
import { listTestsQuerySchema, submitTestSchema } from '../validators/testValidators.js';
import {
  communityTestCreateSchema,
  communityTestsQuerySchema,
} from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/community', validate(communityTestsQuerySchema, 'query'), asyncHandler(communityTestController.listCommunityTests));
router.post('/community', validate(communityTestCreateSchema), asyncHandler(communityTestController.createCommunityTest));
router.get('/', validate(listTestsQuerySchema, 'query'), asyncHandler(testController.listTests));
router.get('/:id', validateParams(objectIdParamsSchema), asyncHandler(testController.getTest));
router.post(
  '/:id/submit',
  checkQuota('mock_submit'),
  validate(submitTestSchema),
  asyncHandler(testController.submitTest),
);

export default router;
