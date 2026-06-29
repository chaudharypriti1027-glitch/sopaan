import mongoose from 'mongoose';

const aiCallLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    feature: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['fast', 'quality'],
      required: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    inputTokens: { type: Number, default: 0, min: 0 },
    outputTokens: { type: Number, default: 0, min: 0 },
    cacheCreationInputTokens: { type: Number, default: 0, min: 0 },
    cacheReadInputTokens: { type: Number, default: 0, min: 0 },
    latencyMs: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

aiCallLogSchema.index({ userId: 1, createdAt: -1 });
aiCallLogSchema.index({ feature: 1, createdAt: -1 });
aiCallLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const AiCallLog = mongoose.model('AiCallLog', aiCallLogSchema);
