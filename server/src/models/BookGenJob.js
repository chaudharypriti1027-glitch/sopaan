import mongoose from 'mongoose';
import { BOOK_GEN_JOB_STATES } from '../constants/library.js';

const bookGenJobSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    spec: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    state: {
      type: String,
      enum: BOOK_GEN_JOB_STATES,
      default: 'queued',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    error: {
      type: String,
      trim: true,
    },
    metrics: {
      inputTokens: { type: Number, default: 0, min: 0 },
      outputTokens: { type: Number, default: 0, min: 0 },
      estimatedCostUsd: { type: Number, default: 0, min: 0 },
      chaptersTotal: { type: Number, default: 0, min: 0 },
      chaptersDone: { type: Number, default: 0, min: 0 },
      chaptersFailed: { type: Number, default: 0, min: 0 },
      failedChapters: {
        type: [
          {
            title: { type: String, trim: true },
            error: { type: String, trim: true },
          },
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  },
);

bookGenJobSchema.index({ state: 1, createdAt: -1 });

export const BookGenJob = mongoose.model('BookGenJob', bookGenJobSchema);
