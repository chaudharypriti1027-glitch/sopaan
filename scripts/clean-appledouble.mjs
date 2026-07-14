#!/usr/bin/env node
/**
 * Remove macOS AppleDouble (._*) metadata files.
 * These appear on exFAT/external drives and break ESLint/Jest.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['mobile', 'server', 'admin', 'shared'];

let removed = 0;

for (const dir of targets) {
  const fullPath = join(root, dir);
  if (!existsSync(fullPath)) {
    continue;
  }

  const listing = execSync(`find "${fullPath}" -name '._*' -type f -print 2>/dev/null || true`, {
    encoding: 'utf8',
  }).trim();

  if (!listing) {
    continue;
  }

  const files = listing.split('\n').filter(Boolean);
  removed += files.length;
  execSync(`find "${fullPath}" -name '._*' -type f -delete 2>/dev/null || true`);
}

if (removed > 0) {
  console.log(`Removed ${removed} AppleDouble metadata file(s).`);
}
