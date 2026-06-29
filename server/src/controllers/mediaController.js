import * as imageUploadService from '../services/media/imageUploadService.js';

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
