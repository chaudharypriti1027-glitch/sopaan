import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { getSeedAdminUser } from './adminConfig.js';
import { ensureAdminUser } from './seedDatabase.js';

async function run() {
  try {
    await connectDatabase();
    await ensureAdminUser();
    const { email } = getSeedAdminUser();
    console.log(`[ensure-admin] Admin account ready: ${email}`);
    console.log('[ensure-admin] Password is SEED_ADMIN_PASSWORD from server/.env');
    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[ensure-admin] Failed:', err.message);
    process.exit(1);
  }
}

run();
