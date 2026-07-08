import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema(
  {
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    durationSec: {
      type: Number,
      required: true,
      min: 1,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    type: {
      type: String,
      enum: ['mock', 'sectional', 'pyq', 'community', 'series'],
      required: true,
    },
    examTag: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'rejected'],
      default: 'draft',
    },
    stats: {
      type: statsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

testSchema.index({ status: 1, createdAt: -1 });
testSchema.index({ status: 1, 'stats.attempts': -1, createdAt: -1 });
testSchema.index({ type: 1, status: 1 });
testSchema.index({ examTag: 1, status: 1 });
testSchema.index({ createdBy: 1 });
testSchema.index({ subject: 1, difficulty: 1 });
testSchema.index({ title: 'text' });

export const Test = mongoose.model('Test', testSchema);
