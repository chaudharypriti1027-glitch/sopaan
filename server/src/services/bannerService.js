import { Banner } from '../models/Banner.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';

export function resolveBannerDeeplink(banner) {
  switch (banner.linkType) {
    case 'premium':
      return '/stack/Premium';
    case 'test_series':
      return '/stack/TestSeries';
    case 'current_affairs':
      return '/tabs/CurrentAffairs';
    case 'live_classes':
      return '/stack/LiveClasses';
    case 'readiness':
      return '/stack/Readiness';
    case 'quiz':
      return banner.linkRef ? `/stack/Quiz/${banner.linkRef}` : '/tabs/Practice';
    case 'deeplink':
      return banner.linkRef?.startsWith('/') ? banner.linkRef : '/tabs/Home';
    default:
      return '/tabs/Home';
  }
}

function formatBanner(doc) {
  return {
    id: doc._id.toString(),
    message: doc.message,
    linkType: doc.linkType,
    linkRef: doc.linkRef ?? null,
    active: Boolean(doc.active),
    deeplink: resolveBannerDeeplink(doc),
    createdBy: doc.createdBy?.toString?.() ?? doc.createdBy ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getActiveBanner() {
  const banner = await Banner.findOne({ active: true }).sort({ updatedAt: -1 }).lean();

  if (!banner) {
    return { banner: null };
  }

  return { banner: formatBanner(banner) };
}

export async function listAdminBanners(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 50, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Banner.find({}).sort({ active: -1, updatedAt: -1 }).skip(offset).limit(limit).lean(),
    Banner.countDocuments({}),
  ]);

  return buildPaginatedResult({
    items: items.map(formatBanner),
    total,
    limit,
    offset,
  });
}

export async function getAdminBannerById(id) {
  const banner = await Banner.findById(id).lean();

  if (!banner) {
    throw new AppError('Banner not found', 404, 'NOT_FOUND');
  }

  return formatBanner(banner);
}

export async function createAdminBanner(userId, payload) {
  const banner = await Banner.create({
    message: payload.message,
    linkType: payload.linkType,
    linkRef: payload.linkRef,
    active: false,
    createdBy: userId,
  });

  return formatBanner(banner.toObject());
}

export async function updateAdminBanner(id, payload) {
  const banner = await Banner.findById(id);

  if (!banner) {
    throw new AppError('Banner not found', 404, 'NOT_FOUND');
  }

  if (payload.message !== undefined) {
    banner.message = payload.message;
  }

  if (payload.linkType !== undefined) {
    banner.linkType = payload.linkType;
  }

  if (payload.linkRef !== undefined) {
    banner.linkRef = payload.linkRef;
  }

  await banner.save();
  return formatBanner(banner.toObject());
}

export async function setAdminBannerActive(id, active) {
  const banner = await Banner.findById(id);

  if (!banner) {
    throw new AppError('Banner not found', 404, 'NOT_FOUND');
  }

  if (active) {
    await Banner.updateMany({ _id: { $ne: banner._id }, active: true }, { $set: { active: false } });
    banner.active = true;
  } else {
    banner.active = false;
  }

  await banner.save();
  return formatBanner(banner.toObject());
}

export async function deleteAdminBanner(id) {
  const banner = await Banner.findByIdAndDelete(id);

  if (!banner) {
    throw new AppError('Banner not found', 404, 'NOT_FOUND');
  }

  return { id: banner._id.toString(), deleted: true };
}
