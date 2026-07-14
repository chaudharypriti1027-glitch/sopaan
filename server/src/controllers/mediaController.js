import * as imageUploadService from '../services/media/imageUploadService.js';
import * as fileUploadService from '../services/media/fileUploadService.js';

export async function uploadImage(req, res) {
  const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : 'general';
  const result = await imageUploadService.uploadUserImage({
    userId: req.user._id,
    buffer: req.file?.buffer,
    mimeType: req.file?.mimetype,
    purpose: purpose || 'general',
  });

  res.json(result);
}

export async function uploadDocument(req, res) {
  const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : 'chat';
  const result = await fileUploadService.uploadUserDocument({
    userId: req.user._id,
    buffer: req.file?.buffer,
    mimeType: req.file?.mimetype,
    originalName: req.file?.originalname,
    purpose: purpose || 'chat',
  });

  res.json(result);
}
