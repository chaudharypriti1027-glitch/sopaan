import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { checkoutOrderSchema } from '../validators/orderValidators.js';

const router = Router();

router.use(requireAuth);
router.post('/', validate(checkoutOrderSchema), asyncHandler(orderController.createOrder));

export default router;
