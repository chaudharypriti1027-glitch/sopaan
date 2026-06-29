import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedKey: {
      type: String,
      trim: true,
      uppercase: true,
    },
    correct: {
      type: Boolean,
      required: true,
    },
    timeSec: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      min: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    totalTimeSec: {
      type: Number,
      min: 0,
    },
    percentile: {
      type: Number,
      min: 0,
      max: 100,
    },
    rank: {
      type: Number,
      min: 1,
    },
    aiFeedback: {
      type: String,
      trim: true,
    },
    weakTopics: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

attemptSchema.index({ userId: 1, testId: 1, createdAt: -1 });
attemptSchema.index({ testId: 1, score: -1 });
attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, accuracy: -1, createdAt: -1 });
attemptSchema.index(
  { accuracy: -1, createdAt: -1 },
  { partialFilterExpression: { accuracy: { $exists: true, $ne: null } } },
);

export const Attempt = mongoose.model('Attempt', attemptSchema);
