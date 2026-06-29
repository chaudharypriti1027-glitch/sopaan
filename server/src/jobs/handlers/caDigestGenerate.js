import { runDailyCaDigest } from '../../services/currentAffairs/currentAffairDigestService.js';
import { runIdempotentJob } from '../jobRunner.js';
import { dailyRunKey } from '../runKeys.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

export async function runCaDigestGenerateJob({ force = false, date, triggeredBy = 'scheduler' } = {}) {
  const runKey = dailyRunKey(date ?? new Date());

  return runIdempotentJob({
    jobName: JOB_NAMES.CA_DIGEST_GENERATE,
    runKey,
    force,
    triggeredBy,
    handler: async () => {
      const result = await runDailyCaDigest({
        date: date ?? new Date(),
        skipNotification: true,
      });

      if (result.skipped) {
        return result;
      }

      return {
        digestDate: result.digestDate,
        digestId: result.digestId,
        newItems: result.newItems,
        sourcesProcessed: result.sourcesProcessed,
      };
    },
  });
}
