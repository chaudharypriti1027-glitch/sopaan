import mongoose from 'mongoose';

export const ENTITLEMENT_STATUSES = Object.freeze([
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
]);

export const ENTITLEMENT_PLANS = Object.freeze(['monthly', 'yearly', 'trial']);

const subscriptionEntitlementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ENTITLEMENT_PLANS,
      required: true,
    },
    status: {
      type: String,
      enum: ENTITLEMENT_STATUSES,
      required: true,
      default: 'active',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'admin'],
      default: 'razorpay',
    },
    providerSubscriptionId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    providerCustomerId: {
      type: String,
      default: null,
    },
    lastPaymentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentOrder',
      default: null,
    },
    lastPaymentId: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

export const SubscriptionEntitlement = mongoose.model(
  'SubscriptionEntitlement',
  subscriptionEntitlementSchema,
);
