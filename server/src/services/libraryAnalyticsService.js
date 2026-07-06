import mongoose from 'mongoose';
import { LIBRARY_EVENT_NAMES, LibraryEvent } from '../models/LibraryEvent.js';
import { AppError } from '../utils/AppError.js';

export async function logLibraryEvent({ userId, event, bookId, metadata = {} }) {
  if (!LIBRARY_EVENT_NAMES.includes(event)) {
    throw new AppError('Invalid library event', 400, 'VALIDATION_ERROR');
  }

  await LibraryEvent.create({
    userId,
    event,
    bookId: bookId && mongoose.Types.ObjectId.isValid(bookId) ? bookId : null,
    metadata,
  });

  return { logged: true };
}
