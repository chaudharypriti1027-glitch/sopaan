import { AdminNotificationSend } from '../../models/AdminNotificationSend.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { dispatchNotificationToUsers } from '../notifications/notificationDispatchService.js';
import { enqueueJob } from '../../jobs/bullmqScheduler.js';
import { JOB_NAMES } from '../../config/jobConfig.js';

const ADMIN_PUSH_TYPE = 'admin_broadcast';
const SEND_LIMIT = Number(process.env.ADMIN_NOTIFICATION_SEND_LIMIT ?? 5000);
const SCHEDULE_BUFFER_MS = 5000;

export function buildAudienceFilter(audience, exam) {
  switch (audience) {
    case 'pro':
      return { isPremium: true };
    case 'free':
      return { isPremium: { $ne: true } };
    case 'active30d': {
      const since = subtractDays(new Date(), 30);
      return {
        $or: [
          { 'streak.lastActiveOn': { $gte: since } },
          { 'streak.lastActiveDate': { $gte: since } },
        ],
      };
    }
    case 'byExam':
      return { targetExam: exam };
    default:
      return {};
  }
}

export async function countAudienceMembers(audience, exam) {
  const filter = buildAudienceFilter(audience, exam);
  return User.countDocuments({ role: 'student', ...filter });
}

function formatCampaign(doc) {
  const delivered = doc.stats?.delivered ?? 0;
  const inApp = doc.stats?.inApp ?? 0;
  const opened = doc.stats?.opened ?? 0;
  const denominator = delivered > 0 ? delivered : inApp;
  const openRate = denominator > 0 ? Math.round((opened / denominator) * 1000) / 10 : 0;

  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    audience: doc.audience,
    exam: doc.exam ?? null,
    sendAt: doc.sendAt,
    status: doc.status,
    stats: {
      targeted: doc.stats?.targeted ?? 0,
      inApp: doc.stats?.inApp ?? 0,
      delivered,
      opened,
      skipped: doc.stats?.skipped ?? 0,
      openRate,
    },
    sentAt: doc.sentAt ?? null,
    completedAt: doc.completedAt ?? null,
    createdAt: doc.createdAt,
    errorMessage: doc.errorMessage ?? null,
  };
}

export async function executeAdminNotificationSend(campaignId) {
  const campaign = await AdminNotificationSend.findById(campaignId);

  if (!campaign) {
    throw new AppError('Notification send not found', 404, 'NOT_FOUND');
  }

  if (campaign.status === 'sent') {
    return formatCampaign(campaign);
  }

  if (campaign.status === 'cancelled') {
    throw new AppError('Notification send was cancelled', 400, 'INVALID_STATUS');
  }

  campaign.status = 'sending';
  campaign.errorMessage = undefined;
  await campaign.save();

  try {
    const filter = buildAudienceFilter(campaign.audience, campaign.exam);
    const users = await User.find({ role: 'student', ...filter }).select('_id').limit(SEND_LIMIT).lean();
    const userIds = users.map((user) => user._id);

    const result = await dispatchNotificationToUsers(userIds, {
      type: ADMIN_PUSH_TYPE,
      title: campaign.title,
      body: campaign.body,
      data: {
        audience: campaign.audience,
        exam: campaign.exam ?? undefined,
      },
      campaignId: campaign._id,
    });

    campaign.stats = {
      targeted: userIds.length,
      inApp: result.inApp,
      delivered: result.pushSent,
      opened: campaign.stats?.opened ?? 0,
      skipped: result.skipped,
    };
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.completedAt = new Date();
    await campaign.save();

    return formatCampaign(campaign);
  } catch (err) {
    campaign.status = 'failed';
    campaign.errorMessage = err?.message ?? String(err);
    campaign.completedAt = new Date();
    await campaign.save();
    throw err;
  }
}

export async function createAdminNotification(userId, payload) {
  const { title, body, audience, exam, sendAt } = payload;
  const scheduledAt = sendAt ? new Date(sendAt) : new Date();
  const isScheduled = scheduledAt.getTime() > Date.now() + SCHEDULE_BUFFER_MS;

  const campaign = await AdminNotificationSend.create({
    title,
    body,
    audience,
    exam: audience === 'byExam' ? exam : undefined,
    sendAt: scheduledAt,
    status: isScheduled ? 'scheduled' : 'sending',
    createdBy: userId,
  });

  if (isScheduled) {
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
    const job = await enqueueJob(
      JOB_NAMES.ADMIN_NOTIFICATION_SEND,
      { campaignId: campaign._id.toString() },
      {
        jobId: `admin-notif-${campaign._id.toString()}`,
        delay: delayMs,
      },
    );

    if (!job) {
      campaign.status = 'failed';
      campaign.errorMessage = 'Job queue unavailable — cannot schedule notification';
      await campaign.save();
      throw new AppError(campaign.errorMessage, 503, 'QUEUE_UNAVAILABLE');
    }

    campaign.bullJobId = job.id ?? `admin-notif-${campaign._id.toString()}`;
    await campaign.save();
    return formatCampaign(campaign);
  }

  return executeAdminNotificationSend(campaign._id.toString());
}

export async function listAdminNotifications(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    AdminNotificationSend.find({}).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    AdminNotificationSend.countDocuments({}),
  ]);

  return buildPaginatedResult({
    items: items.map(formatCampaign),
    total,
    limit,
    offset,
  });
}

export async function recordCampaignOpen(campaignId) {
  if (!campaignId) {
    return;
  }

  await AdminNotificationSend.updateOne({ _id: campaignId }, { $inc: { 'stats.opened': 1 } });
}
