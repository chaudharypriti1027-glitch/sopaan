import { Router } from 'express';
import * as physicalController from '../controllers/physicalController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  paginationQuerySchema,
  physicalLogSchema,
  physicalStandardsQuerySchema,
} from '../validators/featureValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/standards', validate(physicalStandardsQuerySchema, 'query'), asyncHandler(physicalController.getStandards));
router.get('/plan', validate(physicalStandardsQuerySchema, 'query'), asyncHandler(physicalController.getFitnessPlan));
router.get('/logs', validate(paginationQuerySchema, 'query'), asyncHandler(physicalController.listLogs));
router.post('/logs', validate(physicalLogSchema), asyncHandler(physicalController.createLog));

export default router;
