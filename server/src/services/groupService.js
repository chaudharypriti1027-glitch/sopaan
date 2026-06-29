import { StudyGroup } from '../models/StudyGroup.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { caseInsensitiveRegex } from '../utils/regex.js';

export async function listGroups(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {};

  if (query.examTag) {
    filters.examTag = caseInsensitiveRegex(query.examTag);
  }

  const [items, total] = await Promise.all([
    StudyGroup.find(filters)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    StudyGroup.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function createGroup(userId, data) {
  return StudyGroup.create({
    name: data.name,
    examTag: data.examTag,
    createdBy: userId,
    members: [userId],
  });
}

export async function joinGroup(userId, groupId) {
  const group = await StudyGroup.findById(groupId);

  if (!group) {
    throw new AppError('Study group not found', 404, 'NOT_FOUND');
  }

  const isMember = group.members.some((memberId) => memberId.toString() === userId.toString());

  if (!isMember) {
    group.members.push(userId);
    await group.save();
  }

  return group;
}
