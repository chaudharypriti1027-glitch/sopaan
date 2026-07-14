import { disconnectTestDatabase } from '../helpers/db.js';

export default async function globalTeardown() {
  await disconnectTestDatabase().catch(() => undefined);

  const mongod = globalThis.__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
}
