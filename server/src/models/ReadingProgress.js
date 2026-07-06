import mongoose from 'mongoose';

const readingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    lastPage: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastLine: {
      type: Number,
      min: 0,
      default: 0,
    },
    percent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const ReadingProgress = mongoose.model('ReadingProgress', readingProgressSchema);
