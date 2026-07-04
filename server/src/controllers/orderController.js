import * as razorpayService from '../services/razorpayService.js';

export async function createOrder(req, res) {
  const result = await razorpayService.createRazorpayOrder(req.user._id, req.body.plan, {
    couponCode: req.body.couponCode,
  });
  res.status(201).json(result);
}
