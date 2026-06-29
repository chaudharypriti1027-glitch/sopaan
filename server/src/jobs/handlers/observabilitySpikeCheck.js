import { checkObservabilitySpikes } from '../../observability/alerts.js';
import { logger } from '../../observability/logger.js';

export async function runObservabilitySpikeCheckJob() {
  const snapshot = await checkObservabilitySpikes();

  logger.debug('observability spike check completed', snapshot);

  return snapshot;
}
