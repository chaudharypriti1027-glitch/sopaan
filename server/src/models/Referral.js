import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    coins: { type: Number, default: 0, min: 0 },
    trialDays: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refereeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'onboarding_complete', 'rewarded', 'rejected'],
      default: 'pending',
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
    },
    firstTestCompletedAt: {
      type: Date,
      default: null,
    },
    rewardedAt: {
      type: Date,
      default: null,
    },
    referrerReward: {
      type: rewardSchema,
      default: () => ({}),
    },
    refereeReward: {
      type: rewardSchema,
      default: () => ({}),
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

referralSchema.index({ referrerId: 1, createdAt: -1 });
referralSchema.index({ status: 1, createdAt: -1 });

export const Referral = mongoose.model('Referral', referralSchema);
