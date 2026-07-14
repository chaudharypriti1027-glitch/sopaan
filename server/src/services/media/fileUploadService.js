import { isCloudinaryConfigured } from '../../config/cloudinaryConfig.js';
import { AppError } from '../../utils/AppError.js';
import { uploadRawToCloudinary } from './cloudinaryClient.js';

/**
 * Authenticated document upload for student chat attachments.
 * @returns {Promise<{ url: string, name: string, mimeType: string, provider: string }>}
 */
export async function uploadUserDocument({ userId, buffer, mimeType, originalName, purpose = 'chat' }) {
  if (!buffer?.length) {
    throw new AppError('Document file is required', 400, 'VALIDATION_ERROR');
  }

  if (!isCloudinaryConfigured()) {
    throw new AppError('File upload is not configured', 503, 'STORAGE_UNAVAILABLE');
  }

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || `sopaan/uploads/${purpose}`;
  const filename = originalName?.trim() || `document-${userId}-${Date.now()}.pdf`;

  const url = await uploadRawToCloudinary({
    buffer,
    mimeType,
    folder,
    filename,
  });

  return {
    url,
    name: filename,
    mimeType,
    provider: 'cloudinary',
  };
}
