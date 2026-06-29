import crypto from 'crypto';
import { env } from '../../config/env.js';
import { isCloudinaryConfigured } from '../../config/cloudinaryConfig.js';
import { AppError } from '../../utils/AppError.js';
import { uploadImageToCloudinary } from './cloudinaryClient.js';

function resolveProvider() {
  const explicit = process.env.AVATAR_STORAGE_PROVIDER?.trim().toLowerCase();
  if (explicit) {
    return explicit;
  }

  if (isCloudinaryConfigured()) {
    return 'cloudinary';
  }

  return env.isProduction ? 'cloudinary' : 'dev';
}

function extensionForMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

/** Dev — no external upload; stable placeholder URL for local/testing. */
async function uploadDev({ userId, mimeType }) {
  const ext = extensionForMime(mimeType);
  const hash = crypto.createHash('sha256').update(String(userId)).digest('hex').slice(0, 12);
  return `https://cdn.sopaan.dev/avatars/${userId}/${hash}.${ext}`;
}

async function uploadCloudinary({ userId, buffer, mimeType }) {
  const folder = process.env.CLOUDINARY_AVATAR_FOLDER?.trim() || 'sopaan/avatars';

  return uploadImageToCloudinary({
    buffer,
    mimeType,
    folder,
    publicId: String(userId),
    filename: `avatar-${userId}.${extensionForMime(mimeType)}`,
  });
}

/** S3 PutObject via AWS SDK (optional dependency). */
async function uploadS3({ userId, buffer, mimeType }) {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() ?? 'ap-south-1';
  const prefix = process.env.AWS_S3_AVATAR_PREFIX?.trim() || 'avatars';

  if (!bucket) {
    throw new AppError('Avatar upload is not configured', 503, 'STORAGE_UNAVAILABLE');
  }

  let S3Client;
  let PutObjectCommand;

  try {
    ({ S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3'));
  } catch {
    throw new AppError('S3 avatar upload requires @aws-sdk/client-s3', 503, 'STORAGE_UNAVAILABLE');
  }

  const key = `${prefix}/${userId}/${Date.now()}.${extensionForMime(mimeType)}`;
  const client = new S3Client({ region });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    }),
  );

  const publicBase = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload avatar bytes to configured storage (dev | cloudinary | s3).
 * @returns {Promise<string>} public HTTPS URL
 */
export async function uploadAvatarImage({ userId, buffer, mimeType }) {
  const provider = resolveProvider();

  switch (provider) {
    case 'cloudinary':
      return uploadCloudinary({ userId, buffer, mimeType });
    case 's3':
      return uploadS3({ userId, buffer, mimeType });
    case 'dev':
    default:
      return uploadDev({ userId, mimeType });
  }
}
