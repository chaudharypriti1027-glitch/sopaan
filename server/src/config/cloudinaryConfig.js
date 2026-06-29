/**
 * Resolve Cloudinary credentials from CLOUDINARY_URL or discrete env vars.
 * CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
 */

const CLOUDINARY_URL_RE = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/;

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function parseCloudinaryUrl(url) {
  const raw = trim(url);
  if (!raw) {
    return null;
  }

  const match = raw.match(CLOUDINARY_URL_RE);
  if (!match) {
    return null;
  }

  const [, apiKey, apiSecret, cloudName] = match;
  if (!apiKey || !apiSecret || !cloudName) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function getCloudinaryConfig() {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (fromUrl) {
    return fromUrl;
  }

  const cloudName = trim(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = trim(process.env.CLOUDINARY_API_KEY);
  const apiSecret = trim(process.env.CLOUDINARY_API_SECRET);

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured() {
  return getCloudinaryConfig() != null;
}
