import { Progress } from '../../models/Progress.js';
import { safeHomeCall } from './safe.js';

function mapProgressRow(row) {
  return {
    id: row.refId?.toString() ?? String(row._id),
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle ?? '',
    progressPct: row.progressPct ?? 0,
    accent: row.accent ?? 'primary',
    deeplink: row.deeplink,
  };
}

export async function getContinue(user, limit = 6) {
  return safeHomeCall('getContinue', async () => {
    if (!user?._id) {
      return [];
    }

    const rows = await Progress.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return rows.map(mapProgressRow);
  }, []);
}
