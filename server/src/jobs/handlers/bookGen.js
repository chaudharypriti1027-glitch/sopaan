import { runBookGenJob } from '../../workers/bookGen.worker.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

export async function runBookGenHandler({ data } = {}) {
  const jobId = data?.jobId;

  if (!jobId) {
    throw new Error('book-gen job requires jobId');
  }

  return runBookGenJob({ jobId });
}

export { JOB_NAMES };
