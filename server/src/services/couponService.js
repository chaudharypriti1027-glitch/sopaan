import { Coupon } from '../models/Coupon.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';

const MIN_CHARGE_PAISE = 100;

export function normalizeCouponCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

function formatCoupon(doc) {
  return {
    id: doc._id.toString(),
    code: doc.code,
    type: doc.type,
    value: doc.value,
    usageLimit: doc.usageLimit,
    usedCount: doc.usedCount ?? 0,
    expiresAt: doc.expiresAt,
    active: Boolean(doc.active),
    createdBy: doc.createdBy?.toString?.() ?? doc.createdBy ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function computeCouponDiscount(originalAmountPaise, coupon) {
  if (!coupon || originalAmountPaise < MIN_CHARGE_PAISE) {
    return { discountPaise: 0, finalAmountPaise: originalAmountPaise };
  }

  let discountPaise = 0;

  if (coupon.type === 'percent') {
    discountPaise = Math.floor((originalAmountPaise * coupon.value) / 100);
  } else {
    discountPaise = coupon.value;
  }

  discountPaise = Math.max(0, Math.min(discountPaise, originalAmountPaise - MIN_CHARGE_PAISE));
  const finalAmountPaise = originalAmountPaise - discountPaise;

  return { discountPaise, finalAmountPaise };
}

export function assertCouponRedeemable(coupon, now = new Date()) {
  if (!coupon) {
    throw new AppError('Invalid coupon code', 400, 'INVALID_COUPON');
  }

  if (!coupon.active) {
    throw new AppError('This coupon is no longer active', 400, 'COUPON_INACTIVE');
  }

  if (new Date(coupon.expiresAt).getTime() <= now.getTime()) {
    throw new AppError('This coupon has expired', 400, 'COUPON_EXPIRED');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit', 400, 'COUPON_LIMIT_REACHED');
  }
}

export async function findCouponByCode(code) {
  const normalized = normalizeCouponCode(code);

  if (!normalized) {
    return null;
  }

  return Coupon.findOne({ code: normalized });
}

export async function validateCouponForCheckout(code) {
  const coupon = await findCouponByCode(code);
  assertCouponRedeemable(coupon);
  return coupon;
}

export async function listAdminCoupons(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 50, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Coupon.find({}).sort({ active: -1, expiresAt: -1, updatedAt: -1 }).skip(offset).limit(limit).lean(),
    Coupon.countDocuments({}),
  ]);

  return buildPaginatedResult({
    items: items.map(formatCoupon),
    total,
    limit,
    offset,
  });
}

export async function getAdminCouponById(id) {
  const coupon = await Coupon.findById(id).lean();

  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'NOT_FOUND');
  }

  return formatCoupon(coupon);
}

export async function createAdminCoupon(userId, payload) {
  const code = normalizeCouponCode(payload.code);

  const existing = await Coupon.findOne({ code });
  if (existing) {
    throw new AppError('Coupon code already exists', 409, 'DUPLICATE_CODE');
  }

  const coupon = await Coupon.create({
    code,
    type: payload.type,
    value: payload.value,
    usageLimit: payload.usageLimit,
    expiresAt: payload.expiresAt,
    active: true,
    createdBy: userId,
  });

  return formatCoupon(coupon.toObject());
}

export async function updateAdminCoupon(id, payload) {
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'NOT_FOUND');
  }

  if (payload.type !== undefined) {
    coupon.type = payload.type;
  }

  if (payload.value !== undefined) {
    coupon.value = payload.value;
  }

  if (payload.usageLimit !== undefined) {
    if (payload.usageLimit < coupon.usedCount) {
      throw new AppError('Usage limit cannot be less than used count', 400, 'INVALID_USAGE_LIMIT');
    }
    coupon.usageLimit = payload.usageLimit;
  }

  if (payload.expiresAt !== undefined) {
    coupon.expiresAt = payload.expiresAt;
  }

  await coupon.save();
  return formatCoupon(coupon.toObject());
}

export async function setAdminCouponActive(id, active) {
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'NOT_FOUND');
  }

  coupon.active = active;
  await coupon.save();
  return formatCoupon(coupon.toObject());
}

export async function deleteAdminCoupon(id) {
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404, 'NOT_FOUND');
  }

  return { id: coupon._id.toString(), deleted: true };
}

export async function redeemCouponUsage(couponId) {
  const updated = await Coupon.findOneAndUpdate(
    { _id: couponId },
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  return updated;
}
