import { sendDailyCaDigestNotification } from '../../services/currentAffairs/currentAffairDigestService.js';
import { runIdempotentJob } from '../jobRunner.js';
import { dailyRunKey } from '../runKeys.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

export async function runCaDigestNotifyJob({ force = false, date, triggeredBy = 'scheduler' } = {}) {
  const runKey = dailyRunKey(date ?? new Date());

  return runIdempotentJob({
    jobName: JOB_NAMES.CA_DIGEST_NOTIFY,
    runKey,
    force,
    triggeredBy,
    handler: async () => sendDailyCaDigestNotification({ date: date ?? new Date() }),
  });
}
