import mongoose from 'mongoose';
import { BOOK_NOTE_TAGS, BOOK_SUBJECTS, PRO_BOOK_PREVIEW_PAGES } from '../constants/library.js';
import {
  cacheGetOrSet,
  cacheInvalidatePrefix,
  stableCacheKey,
} from '../lib/cache.js';
import { Book, Bookmark, Chapter, Page, ReadingProgress } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { sanitizeBookHtml } from '../utils/sanitizeBookHtml.js';
import { loadUserDownloadMap } from './bookDownloadService.js';
import { canAccessBook, canViewUnpublishedBook } from './libraryAccess.js';
import { upsertHomeProgress } from './home/upsertHomeProgress.js';

const LIBRARY_CACHE_TTL_SEC = 60;
const PUBLISHED_FILTER = { status: 'published' };

function parsePageLimit(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function isDefaultPopularListQuery(query) {
  return (
    (query.sort ?? 'popular') === 'popular' &&
    (query.page ?? 1) === 1 &&
    (query.limit ?? 20) === 20 &&
    !query.subject &&
    !query.type &&
    !query.q &&
    query.pro === undefined
  );
}

function buildTypeFilter(type) {
  if (type === 'notes') {
    return { tags: { $in: BOOK_NOTE_TAGS } };
  }
  if (type === 'books') {
    return { tags: { $nin: BOOK_NOTE_TAGS } };
  }
  return {};
}

function buildSort(sort) {
  if (sort === 'new') {
    return { createdAt: -1 };
  }
  if (sort === 'rating') {
    return { rating: -1, ratingsCount: -1, createdAt: -1 };
  }
  return { ratingsCount: -1, rating: -1, createdAt: -1 };
}

function toChapterPreview(chapter) {
  return {
    id: chapter._id.toString(),
    order: chapter.order,
    title: chapter.title,
  };
}

function toProgressDto(progress) {
  if (!progress) {
    return null;
  }

  return {
    bookId: progress.bookId?.toString(),
    lastPage: progress.lastPage ?? 0,
    lastLine: progress.lastLine ?? 0,
    percent: progress.percent ?? 0,
    updatedAt: progress.updatedAt?.toISOString?.() ?? progress.updatedAt,
  };
}

function toPageDto(page) {
  return {
    id: page._id.toString(),
    order: page.order,
    html: sanitizeBookHtml(page.html),
  };
}

function toReaderPageDto(page, chapter) {
  return {
    id: page._id.toString(),
    order: page.order,
    html: sanitizeBookHtml(page.html),
    chapterId: page.chapterId.toString(),
    chapterTitle: chapter?.title ?? '',
  };
}

function toBookmarkDto(bookmark) {
  return {
    id: bookmark._id.toString(),
    bookId: bookmark.bookId.toString(),
    page: bookmark.page,
    line: bookmark.line ?? 0,
    note: bookmark.note ?? '',
    createdAt: bookmark.createdAt?.toISOString?.() ?? bookmark.createdAt,
  };
}

async function loadReadableBook(bookId, user) {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const book = await Book.findById(bookId);

  if (!book || !canViewUnpublishedBook(book, user)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  return book;
}

async function assertChapterBelongsToBook(bookId, chapterId) {
  if (!mongoose.Types.ObjectId.isValid(chapterId)) {
    throw new AppError('Chapter not found', 404, 'NOT_FOUND');
  }

  const chapter = await Chapter.findOne({ _id: chapterId, bookId }).lean();

  if (!chapter) {
    throw new AppError('Chapter not found', 404, 'NOT_FOUND');
  }

  return chapter;
}

function applyProPageGate(pages, hasFullAccess) {
  if (hasFullAccess || pages.length <= PRO_BOOK_PREVIEW_PAGES) {
    return {
      pages: pages.map(toPageDto),
      locked: false,
      totalPages: pages.length,
    };
  }

  return {
    pages: pages.slice(0, PRO_BOOK_PREVIEW_PAGES).map(toPageDto),
    locked: true,
    totalPages: pages.length,
  };
}

async function assertReadablePageOrder(book, order, user) {
  const hasFullAccess = await canAccessBook(user, book);

  if (hasFullAccess || order <= PRO_BOOK_PREVIEW_PAGES) {
    return hasFullAccess;
  }

  throw new AppError('Upgrade to Pro to read this book', 403, 'PRO_REQUIRED');
}

async function loadUserProgressMap(userId, bookIds) {
  if (!bookIds.length) {
    return new Map();
  }

  const rows = await ReadingProgress.find({
    userId,
    bookId: { $in: bookIds },
  })
    .select('bookId percent')
    .lean();

  return new Map(rows.map((row) => [row.bookId.toString(), row]));
}

function enrichListItem(card, progress, download) {
  const percent = progress?.percent ?? 0;
  const inProgress = percent > 0 && percent < 100;

  return {
    ...card,
    isDownloaded: Boolean(download),
    inProgress,
    ...(inProgress ? { progressPercent: percent } : {}),
  };
}

async function enrichListItemsFromCards(cards, userId) {
  const bookIds = cards.map((card) => new mongoose.Types.ObjectId(card.id));
  const [progressMap, downloadMap] = await Promise.all([
    loadUserProgressMap(userId, bookIds),
    loadUserDownloadMap(userId, bookIds),
  ]);

  return cards.map((card) =>
    enrichListItem(card, progressMap.get(card.id), downloadMap.get(card.id)),
  );
}

async function queryPublishedBooks(query) {
  const { page, limit, skip } = parsePageLimit(query);
  const filter = {
    ...PUBLISHED_FILTER,
    ...buildTypeFilter(query.type),
  };

  if (query.subject) {
    filter.subject = query.subject;
  }

  if (query.pro !== undefined) {
    filter.isPro = query.pro;
  }

  let bookQuery = Book.find(filter);
  let countQuery = Book.countDocuments(filter);

  if (query.q) {
    bookQuery = Book.find({ ...filter, $text: { $search: query.q } }, { score: { $meta: 'textScore' } }).sort({
      score: { $meta: 'textScore' },
    });
    countQuery = Book.countDocuments({ ...filter, $text: { $search: query.q } });
  } else {
    bookQuery = bookQuery.sort(buildSort(query.sort ?? 'popular'));
  }

  const [docs, total] = await Promise.all([
    bookQuery.skip(skip).limit(limit).exec(),
    countQuery,
  ]);

  return { docs, total, page, limit };
}

export async function bustLibraryCache() {
  await cacheInvalidatePrefix('cache:library:');
}

export async function listBooks(query, userId) {
  const useCache = isDefaultPopularListQuery(query);
  const cacheKey = stableCacheKey('cache:library:list:default', {});

  const base = useCache
    ? await cacheGetOrSet(cacheKey, LIBRARY_CACHE_TTL_SEC, async () => {
        const result = await queryPublishedBooks(query);
        return {
          items: result.docs.map((doc) => doc.toCard()),
          total: result.total,
          page: result.page,
          limit: result.limit,
        };
      })
    : await queryPublishedBooks(query).then((result) => ({
        items: result.docs.map((doc) => doc.toCard()),
        total: result.total,
        page: result.page,
        limit: result.limit,
      }));

  const items = await enrichListItemsFromCards(base.items, userId);

  return {
    items,
    page: base.page,
    limit: base.limit,
    total: base.total,
    hasMore: base.page * base.limit < base.total,
  };
}

export async function listSubjects() {
  const cacheKey = 'cache:library:subjects';

  return cacheGetOrSet(cacheKey, LIBRARY_CACHE_TTL_SEC, async () => {
    const counts = await Book.aggregate([
      { $match: PUBLISHED_FILTER },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((row) => [row._id, row.count]));

    return {
      subjects: BOOK_SUBJECTS.map((subject) => ({
        subject,
        count: countMap.get(subject) ?? 0,
      })).filter((row) => row.count > 0),
    };
  });
}

export async function getBookById(bookId, user) {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const book = await Book.findById(bookId);

  if (!book || !canViewUnpublishedBook(book, user)) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const [chapters, progress] = await Promise.all([
    Chapter.find({ bookId: book._id }).sort({ order: 1 }).select('order title').lean(),
    ReadingProgress.findOne({ userId: user._id, bookId: book._id }).lean(),
  ]);

  return {
    book: {
      id: book._id.toString(),
      title: book.title,
      slug: book.slug,
      author: book.author,
      subject: book.subject,
      description: book.description,
      coverTheme: book.coverTheme,
      language: book.language,
      pages: book.pages,
      rating: book.rating,
      ratingsCount: book.ratingsCount,
      isPro: book.isPro,
      status: book.status,
      tags: book.tags,
      createdAt: book.createdAt,
    },
    chapters: chapters.map(toChapterPreview),
    progress: toProgressDto(progress),
  };
}

export async function getBookReaderContent(bookId, user) {
  const book = await loadReadableBook(bookId, user);

  const [chapters, allPages, progress] = await Promise.all([
    Chapter.find({ bookId: book._id }).sort({ order: 1 }).select('order title').lean(),
    Page.find({ bookId: book._id }).sort({ order: 1 }).lean(),
    ReadingProgress.findOne({ userId: user._id, bookId: book._id }).lean(),
  ]);

  const chapterMap = new Map(chapters.map((chapter) => [chapter._id.toString(), chapter]));
  const hasFullAccess = await canAccessBook(user, book);

  let visiblePages = allPages;
  let locked = false;
  const totalPages = allPages.length;

  if (!hasFullAccess && allPages.length > PRO_BOOK_PREVIEW_PAGES) {
    visiblePages = allPages.slice(0, PRO_BOOK_PREVIEW_PAGES);
    locked = true;
  }

  return {
    book: {
      id: book._id.toString(),
      title: book.title,
      slug: book.slug,
      author: book.author,
      subject: book.subject,
      description: book.description,
      coverTheme: book.coverTheme,
      language: book.language,
      pages: book.pages ?? totalPages,
      rating: book.rating,
      ratingsCount: book.ratingsCount,
      isPro: book.isPro,
      status: book.status,
      tags: book.tags,
      createdAt: book.createdAt,
    },
    chapters: chapters.map(toChapterPreview),
    progress: toProgressDto(progress),
    pages: visiblePages.map((page) =>
      toReaderPageDto(page, chapterMap.get(page.chapterId.toString())),
    ),
    locked,
    totalPages,
  };
}

export async function getChapterPages(bookId, chapterId, user) {
  const book = await loadReadableBook(bookId, user);
  await assertChapterBelongsToBook(book._id, chapterId);

  const pages = await Page.find({ bookId: book._id, chapterId })
    .sort({ order: 1 })
    .lean();

  const hasFullAccess = await canAccessBook(user, book);
  return applyProPageGate(pages, hasFullAccess);
}

export async function getPageByOrder(bookId, order, user) {
  const book = await loadReadableBook(bookId, user);
  await assertReadablePageOrder(book, order, user);

  const page = await Page.findOne({ bookId: book._id, order }).lean();

  if (!page) {
    throw new AppError('Page not found', 404, 'NOT_FOUND');
  }

  return { page: toPageDto(page) };
}

export async function upsertReadingProgress(bookId, body, user) {
  const book = await loadReadableBook(bookId, user);

  const progress = await ReadingProgress.findOneAndUpdate(
    { userId: user._id, bookId },
    {
      $set: {
        lastPage: body.page,
        ...(body.line !== undefined ? { lastLine: body.line } : {}),
        ...(body.percent !== undefined ? { percent: body.percent } : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  await upsertHomeProgress(user._id, {
    kind: 'video',
    refId: book._id,
    title: book.title,
    subtitle: book.subject ?? '',
    progressPct: progress.percent ?? 0,
    accent: 'gold',
    deeplink: `/stack/BookReader/${bookId}`,
  });

  return toProgressDto(progress);
}

export async function createBookmark(bookId, body, user) {
  await loadReadableBook(bookId, user);

  const bookmark = await Bookmark.create({
    userId: user._id,
    bookId,
    page: body.page,
    line: body.line ?? 0,
    note: body.note,
  });

  return toBookmarkDto(bookmark);
}

export async function listBookmarks(bookId, user) {
  await loadReadableBook(bookId, user);

  const bookmarks = await Bookmark.find({ userId: user._id, bookId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    bookmarks: bookmarks.map(toBookmarkDto),
  };
}

export async function deleteBookmark(bookId, bookmarkId, user) {
  await loadReadableBook(bookId, user);

  const bookmark = await Bookmark.findOneAndDelete({
    _id: bookmarkId,
    userId: user._id,
    bookId,
  });

  if (!bookmark) {
    throw new AppError('Bookmark not found', 404, 'NOT_FOUND');
  }

  return { deleted: true, id: bookmark._id.toString() };
}
