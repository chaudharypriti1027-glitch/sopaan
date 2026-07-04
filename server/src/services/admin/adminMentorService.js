import { Mentor } from '../../models/Mentor.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { formatMentor } from '../mentorFormat.js';

function resolveSubjects(payload) {
  if (Array.isArray(payload.subjects) && payload.subjects.length) {
    return payload.subjects.map((item) => String(item).trim()).filter(Boolean);
  }
  if (Array.isArray(payload.expertise) && payload.expertise.length) {
    return payload.expertise.map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

function buildAdminFilters(query = {}) {
  const filters = {};

  if (query.q) {
    const term = String(query.q).trim();
    const regex = new RegExp(term, 'i');
    filters.$or = [{ name: regex }, { expertise: regex }, { bio: regex }];
  }

  return filters;
}

export async function listMentors(query = {}) {
  const { limit, offset } = parsePagination(query);
  const filters = buildAdminFilters(query);

  const [items, total] = await Promise.all([
    Mentor.find(filters)
      .populate('userId', 'name email phone')
      .sort({ isActive: -1, rating: -1, updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Mentor.countDocuments(filters),
  ]);

  return buildPaginatedResult({
    items: items.map(formatMentor),
    total,
    limit,
    offset,
  });
}

export async function getMentorById(id) {
  const doc = await Mentor.findById(id).populate('userId', 'name email phone').lean();
  if (!doc) {
    return null;
  }
  return formatMentor(doc);
}

export async function createMentor(payload) {
  const subjects = resolveSubjects(payload);

  if (!payload.userId && !payload.name?.trim()) {
    throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
  }

  if (payload.userId) {
    const user = await User.findById(payload.userId).select('_id role name').lean();
    if (!user) {
      throw new AppError('Linked user not found', 404, 'NOT_FOUND');
    }

    const existing = await Mentor.findOne({ userId: payload.userId }).lean();
    if (existing) {
      throw new AppError('This user is already a mentor', 409, 'CONFLICT');
    }
  }

  const doc = await Mentor.create({
    userId: payload.userId || undefined,
    name: payload.name?.trim() || undefined,
    expertise: subjects,
    bio: payload.bio?.trim() || undefined,
    rate: payload.rate ?? undefined,
    avatarUrl: payload.avatarUrl?.trim() || undefined,
    rating: payload.rating ?? 0,
    sessionsCount: payload.sessionsCount ?? 0,
    slots: payload.slots ?? [],
    isActive: true,
  });

  return getMentorById(doc._id);
}

export async function updateMentor(id, payload) {
  const doc = await Mentor.findById(id);
  if (!doc) {
    throw new AppError('Mentor not found', 404, 'NOT_FOUND');
  }

  if (payload.name != null) {
    doc.name = payload.name.trim() || undefined;
  }

  const subjects = resolveSubjects(payload);
  if (subjects.length) {
    doc.expertise = subjects;
  } else if (payload.subjects != null || payload.expertise != null) {
    doc.expertise = [];
  }

  if (payload.bio != null) {
    doc.bio = payload.bio.trim() || undefined;
  }
  if (payload.rate != null) {
    doc.rate = payload.rate;
  }
  if (payload.avatarUrl != null) {
    doc.avatarUrl = payload.avatarUrl.trim() || undefined;
  }
  if (payload.rating != null) {
    doc.rating = payload.rating;
  }
  if (payload.sessionsCount != null) {
    doc.sessionsCount = payload.sessionsCount;
  }
  if (payload.slots != null) {
    doc.slots = payload.slots;
  }

  await doc.save();
  return getMentorById(id);
}

export async function setMentorActive(id, isActive) {
  const doc = await Mentor.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!doc) {
    throw new AppError('Mentor not found', 404, 'NOT_FOUND');
  }
  return getMentorById(id);
}
