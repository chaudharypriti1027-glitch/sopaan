import mongoose from 'mongoose';
import { cacheInvalidatePrefix } from '../lib/cache.js';
import {
  BOOK_COVER_THEMES,
  BOOK_SOURCES,
  BOOK_STATUSES,
  BOOK_SUBJECTS,
} from '../constants/library.js';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    author: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      enum: BOOK_SUBJECTS,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverTheme: {
      type: String,
      enum: BOOK_COVER_THEMES,
      default: 'navy',
    },
    language: {
      type: String,
      default: 'en',
      trim: true,
    },
    pages: {
      type: Number,
      min: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isPro: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: BOOK_STATUSES,
      default: 'draft',
    },
    source: {
      type: String,
      enum: BOOK_SOURCES,
      default: 'human',
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
);

bookSchema.index({ subject: 1, status: 1 });
bookSchema.index({ title: 'text', author: 'text', tags: 'text' });

async function bustLibraryCacheOnPublish(doc) {
  if (doc?.status === 'published') {
    await cacheInvalidatePrefix('cache:library:');
  }
}

bookSchema.post('save', function onBookSaved() {
  void bustLibraryCacheOnPublish(this);
});

bookSchema.post('findOneAndUpdate', function onBookUpdated(doc) {
  void bustLibraryCacheOnPublish(doc);
});

bookSchema.methods.toCard = function toCard() {
  return {
    id: this._id.toString(),
    title: this.title,
    author: this.author,
    subject: this.subject,
    coverTheme: this.coverTheme,
    rating: this.rating,
    pages: this.pages,
    isPro: this.isPro,
  };
};

export const Book = mongoose.model('Book', bookSchema);
