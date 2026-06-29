import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uriFile = join(__dirname, '.mongo-uri');

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  writeFileSync(uriFile, uri, 'utf8');
  globalThis.__MONGOD__ = mongod;
}
