import mongoose from 'mongoose';

export const LIBRARY_EVENT_NAMES = [
  'book_open',
  'page_read',
  'explain_used',
  'read_aloud_start',
  'download',
  'download_delete',
];

const libraryEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      enum: LIBRARY_EVENT_NAMES,
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

libraryEventSchema.index({ event: 1, createdAt: -1 });
libraryEventSchema.index({ bookId: 1, event: 1, createdAt: -1 });

export const LibraryEvent = mongoose.model('LibraryEvent', libraryEventSchema);
