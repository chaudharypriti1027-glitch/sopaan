import { Router } from 'express';
import * as libraryController from '../controllers/libraryController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { bookExplainRateLimiter } from '../middleware/rateLimiter.js';
import { validate, validateParams } from '../middleware/validate.js';
import {
  libraryBookParamsSchema,
  libraryBookmarkBodySchema,
  libraryBookmarkParamsSchema,
  libraryBooksQuerySchema,
  libraryChapterParamsSchema,
  libraryBookExplainBodySchema,
  libraryEventBodySchema,
  libraryPageOrderParamsSchema,
  libraryProgressBodySchema,
} from '../validation/library.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/subjects', asyncHandler(libraryController.listSubjects));

router.get(
  '/',
  validate(libraryBooksQuerySchema, 'query'),
  asyncHandler(libraryController.listBooks),
);

router.post(
  '/events',
  validate(libraryEventBodySchema),
  asyncHandler(libraryController.trackEvent),
);

router.put(
  '/:id/progress',
  validateParams(libraryBookParamsSchema),
  validate(libraryProgressBodySchema),
  asyncHandler(libraryController.upsertProgress),
);

router.post(
  '/:id/bookmarks',
  validateParams(libraryBookParamsSchema),
  validate(libraryBookmarkBodySchema),
  asyncHandler(libraryController.createBookmark),
);

router.get(
  '/:id/bookmarks',
  validateParams(libraryBookParamsSchema),
  asyncHandler(libraryController.listBookmarks),
);

router.delete(
  '/:id/bookmarks/:bookmarkId',
  validateParams(libraryBookmarkParamsSchema),
  asyncHandler(libraryController.deleteBookmark),
);

router.post(
  '/:id/explain',
  bookExplainRateLimiter,
  validateParams(libraryBookParamsSchema),
  validate(libraryBookExplainBodySchema),
  asyncHandler(libraryController.explainPassage),
);

router.get(
  '/:id/chapters/:chapterId/pages',
  validateParams(libraryChapterParamsSchema),
  asyncHandler(libraryController.getChapterPages),
);

router.get(
  '/:id/pages/:order',
  validateParams(libraryPageOrderParamsSchema),
  asyncHandler(libraryController.getPageByOrder),
);

router.get(
  '/:id/reader',
  validateParams(libraryBookParamsSchema),
  asyncHandler(libraryController.getBookReader),
);

router.get(
  '/:id/download',
  validateParams(libraryBookParamsSchema),
  asyncHandler(libraryController.downloadBook),
);

router.delete(
  '/:id/download',
  validateParams(libraryBookParamsSchema),
  asyncHandler(libraryController.removeDownload),
);

router.get(
  '/:id',
  validateParams(libraryBookParamsSchema),
  asyncHandler(libraryController.getBook),
);

export default router;
