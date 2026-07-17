import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    receipt: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
    originalAmountPaise: {
      type: Number,
      default: null,
      min: 1,
    },
    discountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
      index: true,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    couponRedeemed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

paymentOrderSchema.index({ userId: 1, createdAt: -1 });
// Revenue reports scan paid orders by recency.
paymentOrderSchema.index({ status: 1, createdAt: -1 });
paymentOrderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, sparse: true },
);

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
