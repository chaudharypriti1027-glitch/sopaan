import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Course } from '../../models/Course.js';
import { CurrentAffair } from '../../models/CurrentAffair.js';
import { Media } from '../../models/Media.js';
import { Test } from '../../models/Test.js';
import { env } from '../../config/env.js';
import { getHealthStatus } from '../healthService.js';
import { getMaskedIntegrations } from '../platformSettingsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');

async function uploadsWritable() {
  try {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const probe = path.join(UPLOAD_ROOT, '.write-probe');
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

export async function getAdminSystemCheck() {
  const health = getHealthStatus();
  const integrations = getMaskedIntegrations();

  const [
    coursesPublished,
    coursesDraft,
    affairsPublished,
    affairsDraft,
    testsPublished,
    testsDraft,
    mediaTotal,
    uploadsOk,
  ] = await Promise.all([
    Course.countDocuments({ status: 'published' }),
    Course.countDocuments({ status: 'draft' }),
    CurrentAffair.countDocuments({ status: 'published' }),
    CurrentAffair.countDocuments({ status: 'draft' }),
    Test.countDocuments({ status: 'published' }),
    Test.countDocuments({ status: 'draft' }),
    Media.countDocuments(),
    uploadsWritable(),
  ]);

  const integrationChecks = Object.entries(integrations).map(([name, status]) => ({
    name,
    configured: Boolean(status.configured),
    required: ['anthropic', 'objectStorage'].includes(name),
  }));

  const requiredMissing = integrationChecks.filter((row) => row.required && !row.configured);

  const checks = [
    {
      id: 'api',
      label: 'API server',
      ok: health.status === 'ok',
      detail: health.status === 'ok' ? 'Running' : 'Degraded',
    },
    {
      id: 'mongodb',
      label: 'MongoDB',
      ok: health.mongodb === 'connected',
      detail: health.mongodb,
    },
    {
      id: 'uploads',
      label: 'Media uploads',
      ok: uploadsOk,
      detail: uploadsOk ? 'Writable' : 'Upload folder not writable',
    },
    {
      id: 'integrations',
      label: 'Core integrations',
      ok: requiredMissing.length === 0,
      detail:
        requiredMissing.length === 0
          ? 'Anthropic + storage configured'
          : `Missing: ${requiredMissing.map((row) => row.name).join(', ')}`,
    },
    {
      id: 'student-content',
      label: 'Student-visible content',
      ok: coursesPublished + affairsPublished + testsPublished > 0,
      detail: `${coursesPublished} courses · ${affairsPublished} affairs · ${testsPublished} tests published`,
    },
  ];

  return {
    health,
    integrations: integrationChecks,
    content: {
      coursesPublished,
      coursesDraft,
      affairsPublished,
      affairsDraft,
      testsPublished,
      testsDraft,
      mediaTotal,
    },
    checks,
    allOk: checks.every((check) => check.ok),
    apiOrigin: process.env.MEDIA_DEV_PUBLIC_HOST?.trim() || `http://localhost:${env.port}`,
    assessedAt: new Date().toISOString(),
  };
}
