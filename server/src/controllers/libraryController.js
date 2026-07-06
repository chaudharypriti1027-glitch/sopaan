import * as libraryService from '../services/libraryService.js';
import { explainBookPassage } from '../services/bookExplainService.js';
import {
  deleteBookDownload,
  downloadBookBundle,
} from '../services/bookDownloadService.js';
import { logLibraryEvent } from '../services/libraryAnalyticsService.js';

export async function listBooks(req, res) {
  const result = await libraryService.listBooks(req.validatedQuery, req.user._id);
  res.status(200).json(result);
}

export async function listSubjects(req, res) {
  const result = await libraryService.listSubjects();
  res.status(200).json(result);
}

export async function getBook(req, res) {
  const result = await libraryService.getBookById(req.params.id, req.user);
  res.status(200).json(result);
}

export async function getBookReader(req, res) {
  const result = await libraryService.getBookReaderContent(req.params.id, req.user);
  res.status(200).json(result);
}

export async function getChapterPages(req, res) {
  const result = await libraryService.getChapterPages(
    req.params.id,
    req.params.chapterId,
    req.user,
  );
  res.status(200).json(result);
}

export async function getPageByOrder(req, res) {
  const result = await libraryService.getPageByOrder(
    req.params.id,
    req.params.order,
    req.user,
  );
  res.status(200).json(result);
}

export async function upsertProgress(req, res) {
  const result = await libraryService.upsertReadingProgress(
    req.params.id,
    req.body,
    req.user,
  );
  res.status(200).json(result);
}

export async function createBookmark(req, res) {
  const result = await libraryService.createBookmark(req.params.id, req.body, req.user);
  res.status(201).json(result);
}

export async function listBookmarks(req, res) {
  const result = await libraryService.listBookmarks(req.params.id, req.user);
  res.status(200).json(result);
}

export async function deleteBookmark(req, res) {
  const result = await libraryService.deleteBookmark(
    req.params.id,
    req.params.bookmarkId,
    req.user,
  );
  res.status(200).json(result);
}

export async function explainPassage(req, res) {
  await explainBookPassage(req.params.id, req.body, req.user, res);
}

export async function downloadBook(req, res) {
  const result = await downloadBookBundle(req.params.id, req.user);
  res.status(200).json(result);
}

export async function removeDownload(req, res) {
  const result = await deleteBookDownload(req.params.id, req.user);
  res.status(200).json(result);
}

export async function trackEvent(req, res) {
  const result = await logLibraryEvent({
    userId: req.user._id,
    event: req.body.event,
    bookId: req.body.bookId,
    metadata: req.body.metadata ?? {},
  });
  res.status(201).json(result);
}

