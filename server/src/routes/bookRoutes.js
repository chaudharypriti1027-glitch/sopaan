import { Router } from 'express';
import * as bookController from '../controllers/bookController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { booksQuerySchema } from '../validators/contentValidators.js';

const router = Router();

router.get('/', validate(booksQuerySchema, 'query'), asyncHandler(bookController.listBooks));

export default router;
