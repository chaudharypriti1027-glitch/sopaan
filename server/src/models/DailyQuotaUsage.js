import mongoose from 'mongoose';

const dailyQuotaUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    counts: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

dailyQuotaUsageSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const DailyQuotaUsage = mongoose.model('DailyQuotaUsage', dailyQuotaUsageSchema);
