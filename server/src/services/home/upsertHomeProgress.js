import { Progress } from '../../models/Progress.js';
import { bustHomeFeedCache } from './buildHomeFeed.js';

/**
 * Upsert a row for GET /home continue[] — called when course, test, or book progress changes.
 */
export async function upsertHomeProgress(
  userId,
  {
    kind,
    refId,
    title,
    subtitle = '',
    progressPct = 0,
    accent = 'primary',
    deeplink,
  },
) {
  if (!userId || !refId || !title?.trim() || !deeplink?.trim()) {
    return;
  }

  await Progress.findOneAndUpdate(
    { user: userId, kind, refId },
    {
      $set: {
        title: title.trim(),
        subtitle: subtitle.trim(),
        progressPct: Math.max(0, Math.min(100, progressPct ?? 0)),
        accent,
        deeplink: deeplink.trim(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  await bustHomeFeedCache(userId);
}
