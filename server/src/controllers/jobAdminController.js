import * as jobAdminService from '../services/jobs/jobAdminService.js';
import { triggerJob, getJobHandler } from '../jobs/scheduler.js';
import { AppError } from '../utils/AppError.js';
import { getValidatedQuery } from '../middleware/validate.js';

export async function listJobs(_req, res) {
  const items = await jobAdminService.listJobDefinitions();
  res.status(200).json({ items });
}

export async function listJobRuns(req, res) {
  const result = await jobAdminService.listJobRuns(getValidatedQuery(req));
  res.status(200).json(result);
}

export async function getJobRun(req, res) {
  const run = await jobAdminService.getJobRunById(req.params.id);

  if (!run) {
    throw new AppError('Job run not found', 404, 'NOT_FOUND');
  }

  res.status(200).json(run);
}

export async function runJobNow(req, res) {
  const handler = getJobHandler(req.params.jobName);

  if (!handler) {
    throw new AppError('Unknown job', 404, 'NOT_FOUND');
  }

  const force = req.body?.force === true;
  const result = await triggerJob(req.params.jobName, { force, triggeredBy: 'manual' });

  res.status(200).json(result);
}
