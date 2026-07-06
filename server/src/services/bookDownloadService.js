import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Book, BookDownload, Chapter, Page } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { sanitizeBookHtml } from '../utils/sanitizeBookHtml.js';
import { canAccessBook, canViewUnpublishedBook } from './libraryAccess.js';
import { logLibraryEvent } from './libraryAnalyticsService.js';

const BUNDLE_VERSION = 1;

function bundleSigningSecret() {
  return env.jwtSecret;
}

function computeBundleVersion(book, pageCount) {
  const seed = `${book._id}:${book.updatedAt?.toISOString?.() ?? book.createdAt}:${pageCount}`;
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);
}

function signBundlePayload(payload) {
  const canonical = JSON.stringify({
    version: payload.version,
    bookId: payload.bookId,
    bundleVersion: payload.bundleVersion,
    book: payload.book,
    chapters: payload.chapters,
    pages: payload.pages,
  });

  return crypto.createHmac('sha256', bundleSigningSecret()).update(canonical).digest('hex');
}

async function buildBookBundle(book) {
  const [chapters, pages] = await Promise.all([
    Chapter.find({ bookId: book._id }).sort({ order: 1 }).lean(),
    Page.find({ bookId: book._id }).sort({ order: 1 }).lean(),
  ]);

  const chapterMap = new Map(chapters.map((chapter) => [chapter._id.toString(), chapter]));

  return {
    version: BUNDLE_VERSION,
    bookId: book._id.toString(),
    bundleVersion: computeBundleVersion(book, pages.length),
    generatedAt: new Date().toISOString(),
    book: {
      id: book._id.toString(),
      title: book.title,
      slug: book.slug,
      author: book.author,
      subject: book.subject,
      description: book.description,
      coverTheme: book.coverTheme,
      language: book.language,
      pages: book.pages ?? pages.length,
      isPro: book.isPro,
      tags: book.tags ?? [],
    },
    chapters: chapters.map((chapter) => ({
      id: chapter._id.toString(),
      order: chapter.order,
      title: chapter.title,
      summary: chapter.summary ?? '',
    })),
    pages: pages.map((page) => {
      const chapter = chapterMap.get(page.chapterId.toString());
      return {
        id: page._id.toString(),
        order: page.order,
        chapterId: page.chapterId.toString(),
        chapterTitle: chapter?.title ?? '',
        html: sanitizeBookHtml(page.html),
        plainText: page.plainText ?? '',
      };
    }),
  };
}

export async function downloadBookBundle(bookId, user) {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const book = await Book.findById(bookId);
  if (!book || !canViewUnpublishedBook(book, user)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  if (book.status !== 'published') {
    throw new AppError('Book is not available for download', 400, 'BOOK_NOT_PUBLISHED');
  }

  const hasAccess = await canAccessBook(user, book);
  if (!hasAccess) {
    throw new AppError('Upgrade to Pro to download this book', 403, 'PRO_REQUIRED');
  }

  const payload = await buildBookBundle(book);
  const signature = signBundlePayload(payload);
  const serialized = JSON.stringify({ ...payload, signature });
  const sizeBytes = Buffer.byteLength(serialized, 'utf8');

  await BookDownload.findOneAndUpdate(
    { userId: user._id, bookId: book._id },
    {
      $set: {
        bundleVersion: payload.bundleVersion,
        sizeBytes,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await logLibraryEvent({
    userId: user._id,
    event: 'download',
    bookId: book._id,
    metadata: { bundleVersion: payload.bundleVersion, sizeBytes },
  });

  return {
    ...payload,
    signature,
    sizeBytes,
  };
}

export async function deleteBookDownload(bookId, user) {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const deleted = await BookDownload.findOneAndDelete({
    userId: user._id,
    bookId,
  });

  if (!deleted) {
    throw new AppError('Download not found', 404, 'NOT_FOUND');
  }

  await logLibraryEvent({
    userId: user._id,
    event: 'download_delete',
    bookId,
  });

  return { deleted: true, bookId };
}

export async function loadUserDownloadMap(userId, bookIds) {
  if (!bookIds.length) {
    return new Map();
  }

  const rows = await BookDownload.find({
    userId,
    bookId: { $in: bookIds },
  })
    .select('bookId bundleVersion sizeBytes updatedAt')
    .lean();

  return new Map(rows.map((row) => [row.bookId.toString(), row]));
}
