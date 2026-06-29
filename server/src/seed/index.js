import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedDatabase } from './seedDatabase.js';

async function run() {
  try {
    await connectDatabase();
    const counts = await seedDatabase();

    console.log('[seed] Done:', counts);
    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  }
}

run();
