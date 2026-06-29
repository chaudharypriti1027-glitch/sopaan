import { describe, expect, it, afterEach } from '@jest/globals';
import {
  getCloudinaryConfig,
  isCloudinaryConfigured,
  parseCloudinaryUrl,
} from '../src/config/cloudinaryConfig.js';
import { signCloudinaryParams } from '../src/services/media/cloudinaryClient.js';

describe('cloudinaryConfig', () => {
  it('parses CLOUDINARY_URL', () => {
    const parsed = parseCloudinaryUrl('cloudinary://api-key:api-secret@my-cloud');
    expect(parsed).toEqual({
      apiKey: 'api-key',
      apiSecret: 'api-secret',
      cloudName: 'my-cloud',
    });
  });

  it('returns null for invalid URL', () => {
    expect(parseCloudinaryUrl('not-cloudinary')).toBeNull();
  });
});

describe('signCloudinaryParams', () => {
  it('signs sorted parameters', () => {
    const signature = signCloudinaryParams(
      { folder: 'sopaan/avatars', timestamp: 1_700_000_000 },
      'test-secret',
    );

    expect(signature).toMatch(/^[a-f0-9]{40}$/);
    expect(signature).toBe(
      signCloudinaryParams({ timestamp: 1_700_000_000, folder: 'sopaan/avatars' }, 'test-secret'),
    );
  });
});

describe('isCloudinaryConfigured', () => {
  const originalUrl = process.env.CLOUDINARY_URL;
  const originalName = process.env.CLOUDINARY_CLOUD_NAME;
  const originalKey = process.env.CLOUDINARY_API_KEY;
  const originalSecret = process.env.CLOUDINARY_API_SECRET;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.CLOUDINARY_URL;
    } else {
      process.env.CLOUDINARY_URL = originalUrl;
    }
    if (originalName === undefined) {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    } else {
      process.env.CLOUDINARY_CLOUD_NAME = originalName;
    }
    if (originalKey === undefined) {
      delete process.env.CLOUDINARY_API_KEY;
    } else {
      process.env.CLOUDINARY_API_KEY = originalKey;
    }
    if (originalSecret === undefined) {
      delete process.env.CLOUDINARY_API_SECRET;
    } else {
      process.env.CLOUDINARY_API_SECRET = originalSecret;
    }
  });

  it('detects config from CLOUDINARY_URL', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    process.env.CLOUDINARY_URL = 'cloudinary://key:secret@cloud';

    expect(isCloudinaryConfigured()).toBe(true);
    expect(getCloudinaryConfig()?.cloudName).toBe('cloud');
  });
});
