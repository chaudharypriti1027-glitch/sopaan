import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(_req, file, cb) {
    const allowed =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/json' ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.json');

    if (!allowed) {
      cb(new AppError('Only CSV or JSON files are allowed', 400, 'VALIDATION_ERROR'));
      return;
    }

    cb(null, true);
  },
});

export const importUpload = upload.single('file');

export function optionalImportUpload(req, res, next) {
  if (!req.is('multipart/form-data')) {
    next();
    return;
  }

  importUpload(req, res, (err) => {
    if (err) {
      next(err instanceof AppError ? err : new AppError(err.message, 400, 'VALIDATION_ERROR'));
      return;
    }

    next();
  });
}
