import { Media } from '../../models/Media.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import {
  assertObjectUploaded,
  buildPublicUrl,
  createPresignedUpload,
  deleteStoredObject,
  saveDevMediaFile,
} from '../media/mediaObjectStorage.js';

function formatMedia(doc) {
  const uploadedBy = doc.uploadedBy;
  const uploader =
    uploadedBy && typeof uploadedBy === 'object'
      ? {
          id: uploadedBy._id?.toString?.() ?? String(uploadedBy._id ?? uploadedBy),
          name: uploadedBy.name ?? null,
        }
      : { id: String(uploadedBy), name: null };

  return {
    id: doc._id.toString(),
    key: doc.key,
    url: doc.url,
    type: doc.type,
    sizeBytes: doc.sizeBytes,
    uploadedBy: uploader,
    at: doc.at,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mediaKindFilter(kind) {
  if (kind === 'image') return { type: { $regex: '^image/', $options: 'i' } };
  if (kind === 'video') return { type: { $regex: '^video/', $options: 'i' } };
  return {};
}

export async function presignMediaUpload(userId, payload) {
  return createPresignedUpload({
    userId,
    filename: payload.filename,
    mimeType: payload.mimeType,
    sizeBytes: payload.sizeBytes,
  });
}

export async function completeMediaUpload(userId, payload) {
  const existing = await Media.findOne({ key: payload.key });
  if (existing) {
    return formatMedia(await existing.populate('uploadedBy', 'name email'));
  }

  await assertObjectUploaded({
    key: payload.key,
    mimeType: payload.mimeType,
    sizeBytes: payload.sizeBytes,
  });

  const doc = await Media.create({
    key: payload.key,
    url: buildPublicUrl(payload.key),
    type: payload.mimeType,
    sizeBytes: payload.sizeBytes,
    uploadedBy: userId,
    at: new Date(),
  });

  return formatMedia(await doc.populate('uploadedBy', 'name email'));
}

export async function uploadMediaDirect(userId, { tokenPayload, buffer }) {
  if (!buffer?.length) {
    throw new AppError('File is required', 400, 'VALIDATION_ERROR');
  }

  if (buffer.length > tokenPayload.sizeBytes) {
    throw new AppError('Uploaded file exceeds declared size', 400, 'VALIDATION_ERROR');
  }

  const url = await saveDevMediaFile({ key: tokenPayload.key, buffer });

  const existing = await Media.findOne({ key: tokenPayload.key });
  if (existing) {
    existing.url = url;
    existing.sizeBytes = buffer.length;
    existing.type = tokenPayload.mimeType;
    existing.uploadedBy = userId;
    existing.at = new Date();
    await existing.save();
    return formatMedia(await existing.populate('uploadedBy', 'name email'));
  }

  const doc = await Media.create({
    key: tokenPayload.key,
    url,
    type: tokenPayload.mimeType,
    sizeBytes: buffer.length,
    uploadedBy: userId,
    at: new Date(),
  });

  return formatMedia(await doc.populate('uploadedBy', 'name email'));
}

export async function listMedia(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 30, maxLimit: 100 });
  const filters = mediaKindFilter(query.kind);

  const [items, total] = await Promise.all([
    Media.find(filters)
      .sort({ at: -1 })
      .skip(offset)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .lean(),
    Media.countDocuments(filters),
  ]);

  return buildPaginatedResult({
    items: items.map(formatMedia),
    total,
    limit,
    offset,
  });
}

export async function removeMedia(id) {
  const doc = await Media.findById(id);
  if (!doc) {
    throw new AppError('Media not found', 404, 'NOT_FOUND');
  }

  await deleteStoredObject(doc.key);
  await doc.deleteOne();

  return { id, deleted: true };
}
