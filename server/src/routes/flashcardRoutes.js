import { Router } from 'express';
import * as flashcardController from '../controllers/flashcardController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { paginationQuerySchema } from '../validators/contentValidators.js';
import { flashcardReviewSchema } from '../validators/flashcardValidators.js';

const router = Router();

router.get('/decks', validate(paginationQuerySchema, 'query'), asyncHandler(flashcardController.listDecks));

router.get('/due', requireAuth, validate(paginationQuerySchema, 'query'), asyncHandler(flashcardController.getDueCards));
router.get('/due/count', requireAuth, asyncHandler(flashcardController.getDueCount));
router.get('/due/deck-counts', requireAuth, asyncHandler(flashcardController.getDeckDueCounts));

router.post(
  '/review',
  requireAuth,
  validate(flashcardReviewSchema),
  asyncHandler(flashcardController.reviewCard)
);

export default router;
