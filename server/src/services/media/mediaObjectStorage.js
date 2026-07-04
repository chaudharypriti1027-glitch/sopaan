import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');
const MEDIA_PREFIX = process.env.MEDIA_S3_PREFIX?.trim() || 'media';
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const PRESIGN_TTL_SEC = 15 * 60;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

function sanitizeFilename(filename) {
  return filename
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

function extensionForMime(mimeType) {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/quicktime':
      return 'mov';
    default:
      return 'jpg';
  }
}

export function assertAllowedMediaMime(mimeType) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError('Unsupported media type', 400, 'VALIDATION_ERROR');
  }
}

export function assertAllowedMediaSize(mimeType, sizeBytes) {
  const maxBytes = mimeType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (sizeBytes > maxBytes) {
    throw new AppError('File exceeds size limit', 400, 'VALIDATION_ERROR');
  }
}

export function isObjectStorageConfigured() {
  return Boolean(env.s3Bucket && env.s3AccessKey && env.s3SecretKey);
}

export function buildMediaKey({ userId, filename, mimeType }) {
  const safeName = sanitizeFilename(filename) || `upload.${extensionForMime(mimeType)}`;
  const stamp = Date.now();
  const nonce = crypto.randomBytes(4).toString('hex');
  return `${MEDIA_PREFIX}/${userId}/${stamp}-${nonce}-${safeName}`;
}

export function buildPublicUrl(key) {
  const explicit = process.env.MEDIA_PUBLIC_BASE_URL?.trim() || process.env.S3_PUBLIC_BASE_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/${key}`;
  }

  if (env.s3Endpoint && env.s3Bucket) {
    const endpoint = env.s3Endpoint.replace(/\/$/, '');
    return `${endpoint}/${env.s3Bucket}/${key}`;
  }

  if (env.s3Bucket && env.s3Region) {
    return `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com/${key}`;
  }

  const host = process.env.MEDIA_DEV_PUBLIC_HOST?.trim() || `http://localhost:${env.port}`;
  return `${host.replace(/\/$/, '')}/uploads/${key}`;
}

async function loadS3Modules() {
  try {
    const [{ S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand }, { getSignedUrl }] =
      await Promise.all([
        import('@aws-sdk/client-s3'),
        import('@aws-sdk/s3-request-presigner'),
      ]);
    return { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, getSignedUrl };
  } catch {
    throw new AppError(
      'Object storage SDK is not installed. Run npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
      503,
      'STORAGE_UNAVAILABLE',
    );
  }
}

function createS3Client() {
  const config = {
    region: env.s3Region || 'auto',
    credentials: {
      accessKeyId: env.s3AccessKey,
      secretAccessKey: env.s3SecretKey,
    },
  };

  if (env.s3Endpoint) {
    config.endpoint = env.s3Endpoint;
    config.forcePathStyle = true;
  }

  return config;
}

export async function createPresignedUpload({ userId, filename, mimeType, sizeBytes }) {
  assertAllowedMediaMime(mimeType);
  assertAllowedMediaSize(mimeType, sizeBytes);

  const key = buildMediaKey({ userId, filename, mimeType });
  const publicUrl = buildPublicUrl(key);

  if (!isObjectStorageConfigured()) {
    const uploadToken = jwt.sign(
      { key, mimeType, sizeBytes, sub: String(userId), purpose: 'media-upload' },
      env.jwtSecret,
      { expiresIn: `${PRESIGN_TTL_SEC}s` },
    );

    return {
      mode: 'direct',
      method: 'POST',
      uploadUrl: '/api/admin/media/upload',
      uploadToken,
      key,
      publicUrl,
      headers: {},
    };
  }

  const { S3Client, PutObjectCommand, getSignedUrl } = await loadS3Modules();
  const client = new S3Client(createS3Client());
  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGN_TTL_SEC });

  return {
    mode: 'presigned',
    method: 'PUT',
    uploadUrl,
    uploadToken: null,
    key,
    publicUrl,
    headers: {
      'Content-Type': mimeType,
    },
  };
}

export function verifyMediaUploadToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.purpose !== 'media-upload') {
      throw new AppError('Invalid upload token', 400, 'VALIDATION_ERROR');
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Upload token expired or invalid', 400, 'VALIDATION_ERROR');
  }
}

export async function saveDevMediaFile({ key, buffer }) {
  const target = path.join(UPLOAD_ROOT, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return buildPublicUrl(key);
}

export async function assertObjectUploaded({ key, mimeType, sizeBytes }) {
  if (!isObjectStorageConfigured()) {
    const target = path.join(UPLOAD_ROOT, key);
    try {
      const stat = await fs.stat(target);
      if (stat.size !== sizeBytes) {
        throw new AppError('Uploaded file size mismatch', 400, 'VALIDATION_ERROR');
      }
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Uploaded file not found', 400, 'VALIDATION_ERROR');
    }
  }

  const { S3Client, HeadObjectCommand } = await loadS3Modules();
  const client = new S3Client(createS3Client());

  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
      }),
    );

    if (head.ContentLength != null && head.ContentLength !== sizeBytes) {
      throw new AppError('Uploaded file size mismatch', 400, 'VALIDATION_ERROR');
    }

    if (head.ContentType && head.ContentType !== mimeType) {
      // Allow minor content-type variance from storage providers.
      return;
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
      throw new AppError('Uploaded file not found in storage', 400, 'VALIDATION_ERROR');
    }
    throw err;
  }
}

export async function deleteStoredObject(key) {
  if (!isObjectStorageConfigured()) {
    const target = path.join(UPLOAD_ROOT, key);
    await fs.unlink(target).catch(() => undefined);
    return;
  }

  const { S3Client, DeleteObjectCommand } = await loadS3Modules();
  const client = new S3Client(createS3Client());
  await client
    .send(
      new DeleteObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
      }),
    )
    .catch(() => undefined);
}

export function getUploadRoot() {
  return UPLOAD_ROOT;
}
