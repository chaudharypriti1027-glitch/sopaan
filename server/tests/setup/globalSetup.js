import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { MongoMemoryServer } from 'mongodb-memory-server';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uriFile = join(__dirname, '.mongo-uri');
const downloadDir = join(tmpdir(), 'sopaan-mongodb-memory-server');

export default async function globalSetup() {
  mkdirSync(downloadDir, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    binary: { downloadDir },
    instance: { launchTimeout: 120_000 },
  });
  const uri = mongod.getUri();
  writeFileSync(uriFile, uri, 'utf8');
  globalThis.__MONGOD__ = mongod;
}
