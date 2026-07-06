import mongoose from 'mongoose';
import { sanitizeBookHtml } from '../utils/sanitizeBookHtml.js';

const pageSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    /** Sanitized HTML — sanitize on write in the service layer. */
    html: {
      type: String,
      required: true,
    },
    /** Plain text used by the AI reader / explainer. */
    plainText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  },
);

pageSchema.index({ bookId: 1, order: 1 }, { unique: true });

pageSchema.pre('validate', function sanitizePageHtml() {
  if (typeof this.html === 'string') {
    this.html = sanitizeBookHtml(this.html);
  }
});

import { cacheInvalidatePrefix } from '../lib/cache.js';

async function bustCachesForBook(bookId) {
  await cacheInvalidatePrefix('cache:library:');
  if (bookId) {
    await cacheInvalidatePrefix(`explain:${bookId}:`);
  }
}

pageSchema.post('save', function onPageSaved() {
  void bustCachesForBook(this.bookId?.toString());
});

pageSchema.post('findOneAndUpdate', function onPageUpdated(doc) {
  if (doc?.bookId) {
    void bustCachesForBook(doc.bookId.toString());
  }
});

export const Page = mongoose.model('Page', pageSchema);
