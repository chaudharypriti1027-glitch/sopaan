import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError('Only JPEG, PNG, WebP, or GIF images are allowed', 400, 'VALIDATION_ERROR'));
      return;
    }

    cb(null, true);
  },
});

export const avatarUpload = upload.single('avatar');
