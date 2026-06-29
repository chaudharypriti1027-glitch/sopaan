import mongoose from 'mongoose';

const aiModelFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feature: {
      type: String,
      enum: ['doubt_solver', 'answer_evaluation', 'test_generation', 'attempt_coaching'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
    reason: {
      type: String,
      enum: ['inaccurate', 'off_topic', 'unsafe', 'other'],
      default: 'other',
    },
    userComment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    inputSummary: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    outputSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

aiModelFeedbackSchema.index({ status: 1, createdAt: -1 });
aiModelFeedbackSchema.index({ userId: 1, createdAt: -1 });
aiModelFeedbackSchema.index({ feature: 1, createdAt: -1 });

export const AiModelFeedback = mongoose.model('AiModelFeedback', aiModelFeedbackSchema);
