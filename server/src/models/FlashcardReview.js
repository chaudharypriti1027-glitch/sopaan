import mongoose from 'mongoose';

const flashcardReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: String,
      required: true,
      trim: true,
    },
    easeFactor: {
      type: Number,
      required: true,
      default: 2.5,
      min: 1.3,
    },
    intervalDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    repetitions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

flashcardReviewSchema.index({ userId: 1, cardId: 1 }, { unique: true });
flashcardReviewSchema.index({ userId: 1, dueDate: 1 });

export const FlashcardReview = mongoose.model('FlashcardReview', flashcardReviewSchema);
