import { Router } from 'express';
import * as successStoryController from '../controllers/successStoryController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(successStoryController.listSuccessStories));

export default router;
