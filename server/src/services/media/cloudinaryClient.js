import crypto from 'crypto';
import { getCloudinaryConfig } from '../../config/cloudinaryConfig.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../observability/logger.js';

function extensionForMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

export function signCloudinaryParams(params, apiSecret) {
  const stringToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(stringToSign + apiSecret).digest('hex');
}

/**
 * Upload an image buffer to Cloudinary.
 * @returns {Promise<string>} secure_url
 */
export async function uploadImageToCloudinary({
  buffer,
  mimeType,
  folder,
  publicId,
  filename,
}) {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new AppError('Image upload is not configured', 503, 'STORAGE_UNAVAILABLE');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder,
    timestamp,
  };

  if (publicId) {
    params.public_id = publicId;
    params.overwrite = 'true';
  }

  const signature = signCloudinaryParams(params, config.apiSecret);
  const form = new FormData();
  const safeName = filename ?? `upload.${extensionForMime(mimeType)}`;

  form.append('file', new Blob([buffer], { type: mimeType }), safeName);
  form.append('api_key', config.apiKey);
  form.append('signature', signature);

  for (const [key, value] of Object.entries(params)) {
    form.append(key, String(value));
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    logger.error('[cloudinary] upload failed', {
      status: response.status,
      detail: detail.slice(0, 200),
    });
    throw new AppError('Failed to upload image', 503, 'STORAGE_UNAVAILABLE');
  }

  const payload = await response.json();
  return payload.secure_url;
}
