import { User } from '../../models/User.js';
import { Attempt } from '../../models/Attempt.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { revokeAllSessions } from '../tokens.js';

function buildStudentFilter(query = {}) {
  const filter = { role: 'student' };

  if (query.q) {
    const term = String(query.q).trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
    ];
  }

  return filter;
}

function formatTier(user) {
  if (user.isPremium) {
    return 'Pro';
  }
  return user.leagueTier?.trim() || 'Free';
}

function formatStudentRow(user, stats) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    targetExam: user.targetExam ?? null,
    attempts: stats?.attempts ?? 0,
    accuracy: stats?.avgAccuracy != null ? Math.round(stats.avgAccuracy) : null,
    streak: user.streak?.current ?? user.streak?.count ?? 0,
    tier: formatTier(user),
    isPremium: Boolean(user.isPremium),
    leagueTier: user.leagueTier ?? null,
    accountStatus: user.accountStatus ?? 'active',
    joinedAt: user.createdAt,
  };
}

export async function listStudents(query = {}) {
  const { limit, offset } = parsePagination(query);
  const filter = buildStudentFilter(query);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('name email phone targetExam streak isPremium leagueTier accountStatus createdAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((user) => user._id);
  const attemptStats =
    userIds.length === 0
      ? []
      : await Attempt.aggregate([
          { $match: { userId: { $in: userIds } } },
          {
            $group: {
              _id: '$userId',
              attempts: { $sum: 1 },
              avgAccuracy: { $avg: '$accuracy' },
            },
          },
        ]);

  const statsByUser = new Map(attemptStats.map((row) => [row._id.toString(), row]));

  const items = users.map((user) => formatStudentRow(user, statsByUser.get(user._id.toString())));

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function getStudentById(studentId) {
  const user = await User.findOne({ _id: studentId, role: 'student' })
    .select(
      'name email phone targetExam streak isPremium leagueTier accountStatus createdAt coins level',
    )
    .lean();

  if (!user) {
    return null;
  }

  const [stats, attemptRows] = await Promise.all([
    Attempt.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$userId',
          attempts: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' },
          lastAttemptAt: { $max: '$createdAt' },
        },
      },
    ]),
    Attempt.find({ userId: user._id })
      .populate('testId', 'title subject examTag')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean(),
  ]);

  const row = stats[0];

  return {
    ...formatStudentRow(user, row),
    coins: user.coins ?? 0,
    level: user.level ?? 1,
    lastAttemptAt: row?.lastAttemptAt ?? null,
    attemptHistory: attemptRows.map((attempt) => ({
      id: attempt._id.toString(),
      testTitle: attempt.testId?.title ?? 'Unknown test',
      subject: attempt.testId?.subject ?? null,
      examTag: attempt.testId?.examTag ?? null,
      score: attempt.score ?? null,
      accuracy: attempt.accuracy ?? null,
      totalTimeSec: attempt.totalTimeSec ?? null,
      createdAt: attempt.createdAt,
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

  const stats = await Attempt.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$userId',
        attempts: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
      },
    },
  ]);

  return formatStudentRow(user.toObject(), stats[0]);
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
    .select('name email phone targetExam streak isPremium leagueTier accountStatus createdAt')
    .lean();

  const userIds = users.map((user) => user._id);
  const attemptStats =
    userIds.length === 0
      ? []
      : await Attempt.aggregate([
          { $match: { userId: { $in: userIds } } },
          {
            $group: {
              _id: '$userId',
              attempts: { $sum: 1 },
              avgAccuracy: { $avg: '$accuracy' },
            },
          },
        ]);

  const statsByUser = new Map(attemptStats.map((row) => [row._id.toString(), row]));

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
    'accountStatus',
    'joinedAt',
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
        row.accountStatus,
        row.joinedAt ? new Date(row.joinedAt).toISOString() : '',
      ]
        .map(csvEscape)
        .join(',');
    }),
  ];

  return lines.join('\n');
}
