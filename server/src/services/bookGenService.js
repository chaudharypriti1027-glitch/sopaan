import mongoose from 'mongoose';
import { MAX_CONCURRENT_BOOK_GEN_JOBS } from '../constants/library.js';
import { JOB_NAMES } from '../config/jobConfig.js';
import { enqueueJob } from '../jobs/bullmqScheduler.js';
import { Book, BookGenJob, Page } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { slugifyBookTitle } from '../utils/bookContent.js';
import { CONTENT_DOMAINS, notifyStudentsContentUpdated } from './contentSyncService.js';

async function ensureUniqueSlug(title) {
  const base = slugifyBookTitle(title);
  let candidate = base;
  let suffix = 2;

  while (await Book.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function countActiveGenJobs() {
  return BookGenJob.countDocuments({ state: { $in: ['queued', 'running'] } });
}

export async function createBookGenerationJob(body, user) {
  const activeJobs = await countActiveGenJobs();
  if (activeJobs >= MAX_CONCURRENT_BOOK_GEN_JOBS) {
    throw new AppError(
      `Too many book generation jobs in progress (max ${MAX_CONCURRENT_BOOK_GEN_JOBS})`,
      429,
      'BOOK_GEN_CONCURRENCY_LIMIT'
    );
  }

  const slug = await ensureUniqueSlug(body.title);

  const book = await Book.create({
    title: body.title,
    slug,
    author: body.author ?? 'Sopaan AI',
    subject: body.subject,
    description: body.description,
    coverTheme: body.coverTheme,
    language: body.language,
    isPro: body.isPro,
    status: 'draft',
    source: 'ai',
    pages: 0,
    createdBy: user._id,
    tags: ['ai-generated'],
  });

  const spec = {
    title: body.title,
    subject: body.subject,
    audience: body.audience,
    chapters: body.chapters,
    isPro: body.isPro,
    coverTheme: body.coverTheme,
    language: body.language,
  };

  const job = await BookGenJob.create({
    bookId: book._id,
    requestedBy: user._id,
    spec,
    state: 'queued',
    progress: 0,
    metrics: {
      chaptersTotal: body.chapters.length,
      chaptersDone: 0,
      chaptersFailed: 0,
      failedChapters: [],
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    },
  });

  const queued = await enqueueJob(
    JOB_NAMES.BOOK_GEN,
    { jobId: job._id.toString() },
    {
      jobId: `book-gen-${job._id.toString()}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    }
  );

  if (!queued) {
    if (process.env.NODE_ENV !== 'test') {
      await BookGenJob.findByIdAndUpdate(job._id, {
        state: 'failed',
        error: 'Job queue unavailable',
      });
      await Book.findByIdAndDelete(book._id);
      throw new AppError('Job queue unavailable', 503, 'QUEUE_UNAVAILABLE');
    }
  }

  return {
    bookId: book._id.toString(),
    jobId: job._id.toString(),
  };
}

export async function getBookGenJobStatus(jobId, _user) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError('Generation job not found', 404, 'NOT_FOUND');
  }

  const job = await BookGenJob.findById(jobId).lean();
  if (!job) {
    throw new AppError('Generation job not found', 404, 'NOT_FOUND');
  }

  return {
    jobId: job._id.toString(),
    bookId: job.bookId.toString(),
    state: job.state,
    progress: job.progress ?? 0,
    error: job.error ?? null,
    metrics: job.metrics ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    requestedBy: job.requestedBy?.toString(),
  };
}

export async function publishBook(bookId, _user) {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const pageCount = await Page.countDocuments({ bookId: book._id });
  if (pageCount === 0) {
    throw new AppError('Cannot publish a book with no pages', 400, 'BOOK_EMPTY');
  }

  book.status = 'published';
  if (!book.pages || book.pages < pageCount) {
    book.pages = pageCount;
  }

  await book.save();

  notifyStudentsContentUpdated(CONTENT_DOMAINS.BOOKS, {
    action: 'publish',
    bookId: book._id.toString(),
  });

  return {
    id: book._id.toString(),
    title: book.title,
    slug: book.slug,
    status: book.status,
    pages: book.pages,
  };
}
