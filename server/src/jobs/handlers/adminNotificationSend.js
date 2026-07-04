import { executeAdminNotificationSend } from '../../services/admin/adminNotificationService.js';
import { logger } from '../../observability/logger.js';

export async function runAdminNotificationSendJob({ data, triggeredBy = 'bullmq' } = {}) {
  const campaignId = data?.campaignId;

  if (!campaignId) {
    throw new Error('admin-notification-send requires campaignId');
  }

  logger.info('[jobs] admin notification send started', { campaignId, triggeredBy });
  const result = await executeAdminNotificationSend(campaignId);
  logger.info('[jobs] admin notification send completed', {
    campaignId,
    delivered: result.stats?.delivered ?? 0,
    targeted: result.stats?.targeted ?? 0,
  });

  return result;
}
