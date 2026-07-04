/** Admin credentials for `npm run seed` — override via server .env. */
export function getSeedAdminUser() {
  return {
    name: process.env.SEED_ADMIN_NAME?.trim() || 'Sopaan Admin',
    email: (process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@sopaan.dev').toLowerCase(),
    phone: process.env.SEED_ADMIN_PHONE?.trim() || '9999999999',
    role: 'admin',
    password: process.env.SEED_ADMIN_PASSWORD?.trim() || 'Password123!',
  };
}
