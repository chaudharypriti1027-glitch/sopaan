import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(
        new AppError('Only PDF, TXT, Word, or Excel documents are allowed', 400, 'VALIDATION_ERROR'),
      );
      return;
    }

    cb(null, true);
  },
});

export const documentUpload = upload.single('document');
