import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
  },
);

chapterSchema.index({ bookId: 1, order: 1 }, { unique: true });

export const Chapter = mongoose.model('Chapter', chapterSchema);
