import { User } from '../../models/User.js';
import { Attempt } from '../../models/Attempt.js';
import { Goal } from '../../models/Goal.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { revokeAllSessions } from '../tokens.js';
import {
  formatEntitlementDto,
  getEntitlementByUserId,
  grantAdminPremium,
  listPaymentHistory,
  revokeStudentPremium,
} from '../entitlementService.js';
import { SubscriptionEntitlement } from '../../models/SubscriptionEntitlement.js';

const STUDENT_LIST_SELECT =
  'name email phone targetExam examDate streak isPremium premiumPlan premiumExpiresAt premiumTrialUsed leagueTier accountStatus createdAt';

const STUDENT_DETAIL_SELECT = `${STUDENT_LIST_SELECT} coins level xp language educationLevel state category onboardingComplete`;

function toIsoOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildStudentFilter(query = {}) {
  const filter = { role: 'student' };

  if (query.q) {
    const term = String(query.q).trim();
    if (term) {
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
      ];
    }
  }

  if (query.exam) {
    filter.targetExam = { $regex: `^${escapeRegex(String(query.exam).trim())}$`, $options: 'i' };
  }

  if (query.status) {
    filter.accountStatus = query.status;
  }

  if (query.premium === 'pro') {
    filter.isPremium = true;
    filter.premiumPlan = { $in: ['monthly', 'yearly'] };
  } else if (query.premium === 'trial') {
    filter.isPremium = true;
    filter.premiumPlan = 'trial';
  } else if (query.premium === 'free') {
    filter.isPremium = { $ne: true };
  }

  return filter;
}

function formatTier(user) {
  if (user.isPremium) {
    if (user.premiumPlan === 'trial') {
      return 'Trial';
    }
    return 'Pro';
  }
  return user.leagueTier?.trim() || 'Free';
}

function premiumSource(user, entitlement = null) {
  if (!user.isPremium) {
    return 'none';
  }
  if (entitlement?.provider === 'admin' || entitlement?.metadata?.lastEvent === 'admin_grant') {
    return 'admin';
  }
  if (user.premiumPlan === 'trial') {
    return 'trial';
  }
  if (user.premiumPlan === 'monthly' || user.premiumPlan === 'yearly') {
    return 'paid';
  }
  return 'unknown';
}

function formatPremiumSummary(user, entitlement = null) {
  const cancelled =
    entitlement?.status === 'cancelled' ||
    Boolean(entitlement?.cancelledAt) ||
    Boolean(entitlement?.cancelAtPeriodEnd);

  return {
    isPremium: Boolean(user.isPremium),
    plan: user.premiumPlan ?? null,
    expiresAt: toIsoOrNull(user.premiumExpiresAt),
    trialUsed: Boolean(user.premiumTrialUsed),
    source: premiumSource(user, entitlement),
    cancelled,
    status: entitlement?.status ?? (user.isPremium ? 'active' : 'none'),
    cancelAtPeriodEnd: Boolean(entitlement?.cancelAtPeriodEnd),
    cancelledAt: entitlement?.cancelledAt ?? null,
  };
}

function formatStudentRow(user, stats, entitlement = null) {
  const premium = formatPremiumSummary(user, entitlement);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    targetExam: user.targetExam ?? null,
    examDate: toIsoOrNull(user.examDate),
    attempts: stats?.attempts ?? 0,
    accuracy: stats?.avgAccuracy != null ? Math.round(stats.avgAccuracy) : null,
    streak: user.streak?.current ?? user.streak?.count ?? 0,
    lastActiveAt: toIsoOrNull(user.streak?.lastActiveOn ?? user.streak?.lastActiveDate),
    tier: formatTier(user),
    isPremium: premium.isPremium,
    premiumPlan: premium.plan,
    premiumExpiresAt: premium.expiresAt,
    premiumTrialUsed: premium.trialUsed,
    premiumSource: premium.source,
    leagueTier: user.leagueTier ?? null,
    accountStatus: user.accountStatus ?? 'active',
    joinedAt: toIsoOrNull(user.createdAt),
  };
}

async function attemptStatsForUsers(userIds) {
  if (userIds.length === 0) {
    return new Map();
  }

  const attemptStats = await Attempt.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: '$userId',
        attempts: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
        lastAttemptAt: { $max: '$createdAt' },
      },
    },
  ]);

  return new Map(attemptStats.map((row) => [row._id.toString(), row]));
}

export async function listStudents(query = {}) {
  const { limit, offset } = parsePagination(query);
  const filter = buildStudentFilter(query);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select(STUDENT_LIST_SELECT)
      .lean(),
    User.countDocuments(filter),
  ]);

  const statsByUser = await attemptStatsForUsers(users.map((user) => user._id));
  const entitlements = await SubscriptionEntitlement.find({
    userId: { $in: users.map((user) => user._id) },
  })
    .select('userId plan status provider cancelAtPeriodEnd cancelledAt currentPeriodEnd metadata')
    .lean();
  const entitlementByUser = new Map(
    entitlements.map((row) => [row.userId.toString(), formatEntitlementDto(row)]),
  );

  const items = users.map((user) =>
    formatStudentRow(
      user,
      statsByUser.get(user._id.toString()),
      entitlementByUser.get(user._id.toString()) ?? null,
    ),
  );

  return buildPaginatedResult({ items, total, limit, offset });
}

function formatGoal(goal) {
  return {
    id: goal._id.toString(),
    examId: goal.examId?.toString?.() ?? goal.examId ?? null,
    examName: goal.examName,
    examDate: toIsoOrNull(goal.examDate),
    targetRank: goal.targetRank ?? null,
    createdAt: toIsoOrNull(goal.createdAt),
  };
}

export async function getStudentById(studentId) {
  const user = await User.findOne({ _id: studentId, role: 'student' })
    .select(STUDENT_DETAIL_SELECT)
    .lean();

  if (!user) {
    return null;
  }

  const [statsByUser, attemptRows, goals, entitlement, payments] = await Promise.all([
    attemptStatsForUsers([user._id]),
    Attempt.find({ userId: user._id })
      .populate('testId', 'title subject examTag type')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean(),
    Goal.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    getEntitlementByUserId(user._id),
    listPaymentHistory(user._id, { limit: 10, offset: 0 }),
  ]);

  const row = statsByUser.get(user._id.toString());
  const entitlementDto = formatEntitlementDto(entitlement);
  const premium = formatPremiumSummary(user, entitlementDto);

  return {
    ...formatStudentRow(user, row, entitlementDto),
    language: user.language ?? null,
    educationLevel: user.educationLevel ?? null,
    state: user.state ?? null,
    category: user.category ?? null,
    onboardingComplete: Boolean(user.onboardingComplete),
    coins: user.coins ?? 0,
    level: user.level ?? 1,
    xp: user.xp ?? 0,
    premium,
    entitlement: entitlementDto
      ? {
          plan: entitlementDto.plan,
          status: entitlementDto.status,
          currentPeriodStart: entitlementDto.currentPeriodStart,
          currentPeriodEnd: entitlementDto.currentPeriodEnd,
          cancelAtPeriodEnd: entitlementDto.cancelAtPeriodEnd,
          cancelledAt: entitlementDto.cancelledAt,
          hasAccess: entitlementDto.hasAccess,
          autoRenews: entitlementDto.autoRenews,
          provider: entitlementDto.provider,
        }
      : null,
    goals: goals.map(formatGoal),
    payments: (payments.items ?? []).map((order) => ({
      id: order.id?.toString?.() ?? String(order.id),
      plan: order.plan,
      amountPaise: order.amountPaise,
      currency: order.currency,
      status: order.status,
      createdAt: toIsoOrNull(order.createdAt),
    })),
    lastAttemptAt: toIsoOrNull(row?.lastAttemptAt),
    attemptHistory: attemptRows.map((attempt) => ({
      id: attempt._id.toString(),
      testTitle: attempt.testId?.title ?? 'Unknown test',
      subject: attempt.testId?.subject ?? null,
      examTag: attempt.testId?.examTag ?? null,
      testType: attempt.testId?.type ?? null,
      score: attempt.score ?? null,
      accuracy: attempt.accuracy ?? null,
      totalTimeSec: attempt.totalTimeSec ?? null,
      createdAt: toIsoOrNull(attempt.createdAt),
    })),
  };
}

export async function setStudentStatus(studentId, status) {
  const user = await User.findOne({ _id: studentId, role: 'student' });

  if (!user) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  if (user.accountStatus === 'deleted') {
    throw new AppError('Student account has been deleted', 400, 'VALIDATION_ERROR');
  }

  user.accountStatus = status;
  await user.save();

  if (status === 'suspended') {
    await revokeAllSessions(user._id);
  }

  const statsByUser = await attemptStatsForUsers([user._id]);
  return formatStudentRow(user.toObject(), statsByUser.get(user._id.toString()));
}

export async function grantStudentPremium(studentId, { plan, days }, adminId) {
  const user = await User.findOne({ _id: studentId, role: 'student' });

  if (!user) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  if (user.accountStatus === 'deleted') {
    throw new AppError('Student account has been deleted', 400, 'VALIDATION_ERROR');
  }

  await grantAdminPremium(user._id, { plan, days, adminId });
  return getStudentById(studentId);
}

export async function revokeStudentPremiumAccess(studentId, adminId) {
  const user = await User.findOne({ _id: studentId, role: 'student' });

  if (!user) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  await revokeStudentPremium(user._id, { adminId });
  return getStudentById(studentId);
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportStudentsCsv(query = {}) {
  const filter = buildStudentFilter(query);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .select(STUDENT_LIST_SELECT)
    .lean();

  const statsByUser = await attemptStatsForUsers(users.map((user) => user._id));

  const header = [
    'id',
    'name',
    'email',
    'phone',
    'targetExam',
    'attempts',
    'accuracy',
    'streak',
    'tier',
    'premiumPlan',
    'premiumExpiresAt',
    'accountStatus',
    'joinedAt',
    'lastActiveAt',
  ];

  const lines = [
    header.join(','),
    ...users.map((user) => {
      const row = formatStudentRow(user, statsByUser.get(user._id.toString()));
      return [
        row.id,
        row.name,
        row.email,
        row.phone,
        row.targetExam,
        row.attempts,
        row.accuracy,
        row.streak,
        row.tier,
        row.premiumPlan,
        row.premiumExpiresAt,
        row.accountStatus,
        row.joinedAt ? new Date(row.joinedAt).toISOString() : '',
        row.lastActiveAt ? new Date(row.lastActiveAt).toISOString() : '',
      ]
        .map(csvEscape)
        .join(',');
    }),
  ];

  return lines.join('\n');
}
