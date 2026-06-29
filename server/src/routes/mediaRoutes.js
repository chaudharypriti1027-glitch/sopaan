import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { imageUpload } from '../middleware/imageUpload.js';
import * as mediaController from '../controllers/mediaController.js';

const router = Router();

router.post(
  '/image',
  requireAuth,
  (req, res, next) => {
    imageUpload(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  asyncHandler(mediaController.uploadImage),
);

export default router;
