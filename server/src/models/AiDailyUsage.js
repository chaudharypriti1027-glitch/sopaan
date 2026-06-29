import mongoose from 'mongoose';

const aiDailyUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    fastCalls: { type: Number, default: 0, min: 0 },
    qualityCalls: { type: Number, default: 0, min: 0 },
    inputTokens: { type: Number, default: 0, min: 0 },
    outputTokens: { type: Number, default: 0, min: 0 },
    cacheReadTokens: { type: Number, default: 0, min: 0 },
    cacheWriteTokens: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

aiDailyUsageSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const AiDailyUsage = mongoose.model('AiDailyUsage', aiDailyUsageSchema);
