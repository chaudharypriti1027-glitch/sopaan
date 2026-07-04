import { User } from '../../models/User.js';
import { Attempt } from '../../models/Attempt.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

export async function listStudents(query = {}) {
  const { limit, offset } = parsePagination(query);
  const filter = { role: 'student' };

  if (query.q) {
    const term = String(query.q).trim();
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('name email phone targetExam streak isPremium createdAt')
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

  const items = users.map((user) => {
    const stats = statsByUser.get(user._id.toString());
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      targetExam: user.targetExam ?? null,
      attempts: stats?.attempts ?? 0,
      accuracy: stats?.avgAccuracy != null ? Math.round(stats.avgAccuracy) : null,
      streak: user.streak?.current ?? user.streak?.count ?? 0,
      isPremium: Boolean(user.isPremium),
      joinedAt: user.createdAt,
    };
  });

  return buildPaginatedResult({ items, total, limit, offset });
}
