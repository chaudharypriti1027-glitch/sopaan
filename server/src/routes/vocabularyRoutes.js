import { Router } from 'express';
import * as vocabularyController from '../controllers/vocabularyController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.get('/today', asyncHandler(vocabularyController.getTodaysVocabulary));
router.get('/recent', validate(paginationQuerySchema, 'query'), asyncHandler(vocabularyController.listRecentVocabulary));

export default router;
