import { generatePlansForActiveStudents } from '../../services/plannerService.js';
import { runIdempotentJob } from '../jobRunner.js';
import { dailyRunKey } from '../runKeys.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

export async function runDailyPlanJob({ force = false, date, triggeredBy = 'scheduler' } = {}) {
  const runKey = dailyRunKey(date ?? new Date());

  return runIdempotentJob({
    jobName: JOB_NAMES.DAILY_PLAN,
    runKey,
    force,
    triggeredBy,
    handler: async () => {
      const result = await generatePlansForActiveStudents(
        date ? dailyRunKey(date) : undefined,
      );
      return result;
    },
  });
}
