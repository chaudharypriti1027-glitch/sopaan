import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

badgeSchema.index({ userId: 1, key: 1 }, { unique: true });
badgeSchema.index({ userId: 1, earnedAt: -1 });

export const Badge = mongoose.model('Badge', badgeSchema);
