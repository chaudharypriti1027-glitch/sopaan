#!/usr/bin/env node
/**
 * Prints the secrets backup inventory (names only — never values).
 * Store actual values in your secret manager with versioning enabled.
 *
 * Usage: cd server && npm run backup:secrets-inventory
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, '../../config/secrets-backup-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

console.log('# Secrets backup inventory\n');
console.log(`Platform: ${manifest.recommendedPlatform}`);
console.log(`Rotation policy: ${manifest.rotationPolicy}`);
console.log(`Last reviewed: ${manifest.lastReviewed}\n`);

for (const group of manifest.groups) {
  console.log(`## ${group.name}`);
  console.log(group.description);
  for (const item of group.secrets) {
    const required = item.requiredInProduction ? 'required' : 'optional';
    console.log(`  - ${item.envVar} (${required}): ${item.notes}`);
  }
  console.log('');
}

console.log('Export checklist:');
for (const step of manifest.exportChecklist) {
  console.log(`  [ ] ${step}`);
}
