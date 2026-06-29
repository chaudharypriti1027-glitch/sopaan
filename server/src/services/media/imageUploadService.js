import { isCloudinaryConfigured } from '../../config/cloudinaryConfig.js';
import { AppError } from '../../utils/AppError.js';
import { uploadImageToCloudinary } from './cloudinaryClient.js';

function extensionForMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

/**
 * Generic authenticated image upload (notes, scans, admin assets).
 * @returns {Promise<{ url: string, provider: string }>}
 */
export async function uploadUserImage({ userId, buffer, mimeType, purpose = 'general' }) {
  if (!buffer?.length) {
    throw new AppError('Image file is required', 400, 'VALIDATION_ERROR');
  }

  if (!isCloudinaryConfigured()) {
    throw new AppError('Image upload is not configured', 503, 'STORAGE_UNAVAILABLE');
  }

  const folder =
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || `sopaan/uploads/${purpose}`;
  const filename = `${purpose}-${userId}-${Date.now()}.${extensionForMime(mimeType)}`;

  const url = await uploadImageToCloudinary({
    buffer,
    mimeType,
    folder,
    filename,
  });

  return { url, provider: 'cloudinary' };
}
