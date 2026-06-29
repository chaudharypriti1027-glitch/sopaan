import mongoose from 'mongoose';

const deferredReferralClickSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    installId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

deferredReferralClickSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DeferredReferralClick = mongoose.model(
  'DeferredReferralClick',
  deferredReferralClickSchema,
);
