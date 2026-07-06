import mongoose from 'mongoose';

const bookDownloadSchema = new mongoose.Schema(
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
    bundleVersion: {
      type: String,
      trim: true,
      required: true,
    },
    sizeBytes: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
);

bookDownloadSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const BookDownload = mongoose.model('BookDownload', bookDownloadSchema);
