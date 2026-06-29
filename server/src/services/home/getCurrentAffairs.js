import { CurrentAffair } from '../../models/CurrentAffair.js';
import { publishedContentFilter } from '../../models/publishableFields.js';
import { isNewsApiEnabled } from '../../config/newsApiConfig.js';
import { listCurrentAffairs } from '../currentAffairService.js';
import { safeHomeCall } from './safe.js';

function estimateReadMin(text) {
  const words = (text ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.min(12, Math.round(words / 200) || 3));
}

function mapAffairCard(item) {
  return {
    id: item.id ?? item._id?.toString(),
    source: item.source ?? item.category ?? 'Current Affairs',
    headline: item.title,
    readMin: estimateReadMin(item.summary ?? item.title),
    imageUrl: item.imageUrl,
    imageColor: item.imageColor,
  };
}

export async function getCurrentAffairs(limit = 3) {
  return safeHomeCall('getCurrentAffairs', async () => {
    if (isNewsApiEnabled()) {
      const { items } = await listCurrentAffairs({
        limit,
        offset: 0,
        state: 'National',
      });
      return items.map(mapAffairCard);
    }

    const affairs = await CurrentAffair.find(publishedContentFilter)
      .select('title source summary category publishedAt imageColor imageUrl')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return affairs.map((item) =>
      mapAffairCard({
        ...item,
        id: item._id.toString(),
      }),
    );
  }, []);
}
