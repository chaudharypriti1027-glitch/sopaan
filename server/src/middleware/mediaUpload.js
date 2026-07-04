import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const MAX_BYTES = 200 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

export const mediaDirectUpload = upload.single('file');

export function handleMediaUploadError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('File exceeds size limit', 400, 'VALIDATION_ERROR'));
      return;
    }
    next(new AppError(err.message, 400, 'VALIDATION_ERROR'));
    return;
  }

  next(err);
}
