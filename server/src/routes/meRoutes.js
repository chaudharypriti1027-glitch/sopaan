import { Router } from 'express';
import * as meController from '../controllers/meController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { avatarUpload } from '../middleware/avatarUpload.js';
import { updateMeSchema } from '../validators/meValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', asyncHandler(meController.getMeSummary));
router.get('/', asyncHandler(meController.getMe));
router.put('/', validate(updateMeSchema), asyncHandler(meController.updateMe));
router.post(
  '/avatar',
  (req, res, next) => {
    avatarUpload(req, res, (err) => {
      if (err) {
        next(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      next();
    });
  },
  asyncHandler(meController.uploadAvatar),
);

export default router;
