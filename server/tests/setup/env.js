import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uriFile = join(__dirname, '.mongo-uri');

const mongoUri = existsSync(uriFile)
  ? readFileSync(uriFile, 'utf8').trim()
  : 'mongodb://127.0.0.1:27017/sopaan_test';

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.MONGODB_URI = mongoUri;
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-chars';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.CLIENT_URL = 'http://localhost:8081';
process.env.EMBEDDING_PROVIDER = 'noop';
process.env.EMBEDDING_DIMENSIONS = '512';
process.env.AVATAR_STORAGE_PROVIDER = 'dev';
process.env.CLOUDINARY_URL = '';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';
