import mongoose from 'mongoose';

const answerEvaluationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    answerText: {
      type: String,
      trim: true,
      maxlength: 8000,
      default: null,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    subScores: {
      content: { type: Number, min: 0 },
      structure: { type: Number, min: 0 },
      clarity: { type: Number, min: 0 },
    },
    feedback: {
      type: [String],
      default: [],
    },
    reviewStatus: {
      type: String,
      enum: ['none', 'pending', 'kept', 'overridden'],
      default: 'none',
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

answerEvaluationSchema.index({ userId: 1, createdAt: -1 });

export const AnswerEvaluation = mongoose.model('AnswerEvaluation', answerEvaluationSchema);
