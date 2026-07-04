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
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerEvaluation',
      default: null,
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      default: null,
      index: true,
    },
    maxMarks: {
      type: Number,
      min: 1,
      default: null,
    },
    finalGrade: {
      type: Number,
      min: 0,
      default: null,
    },
    reviewAction: {
      type: String,
      enum: ['keep', 'override'],
      default: null,
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
