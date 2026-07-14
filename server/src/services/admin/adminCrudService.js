import { Exam } from '../../models/Exam.js';
import { Course } from '../../models/Course.js';
import { CurrentAffair } from '../../models/CurrentAffair.js';
import { Mentor } from '../../models/Mentor.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';
import { withAuditOnCreate, withAuditOnUpdate } from '../../models/publishableFields.js';
import { notifyStudentsContentUpdated } from '../contentSyncService.js';

function syncContentDomain(domain, action) {
  if (!domain) {
    return;
  }

  notifyStudentsContentUpdated(domain, { action });
}

const auditPopulate = [
  { path: 'createdBy', select: 'name email' },
  { path: 'updatedBy', select: 'name email' },
];

function buildAdminFilters(query, extraFilter, { textSearch = true } = {}) {
  const filters = extraFilter?.(query) ?? {};

  if (query.status) {
    filters.status = query.status;
  }

  if (textSearch && query.q) {
    filters.$text = { $search: query.q };
  }

  return filters;
}

function crudHandlers(
  Model,
  { populate, searchFilter, useTextSort = true, withAudit = true, textSearch = true, contentDomain } = {},
) {
  const populates = [...(withAudit ? auditPopulate : []), ...(populate ? [populate] : [])];

  return {
    async list(query) {
      const { limit, offset } = parsePagination(query);
      const filters = buildAdminFilters(query, searchFilter, { textSearch });

      let finder = Model.find(filters)
        .sort(query.q && useTextSort ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
        .skip(offset)
        .limit(limit);

      for (const item of populates) {
        finder = finder.populate(item);
      }

      const [items, total] = await Promise.all([finder.lean(), Model.countDocuments(filters)]);

      return buildPaginatedResult({ items, total, limit, offset });
    },

    async getById(id) {
      let finder = Model.findById(id);

      for (const item of populates) {
        finder = finder.populate(item);
      }

      const doc = await finder.lean();

      if (!doc) {
        throw new AppError(`${Model.modelName} not found`, 404, 'NOT_FOUND');
      }

      return doc;
    },

    async create(data, userId) {
      const payload = userId ? withAuditOnCreate(data, userId) : data;
      const doc = await Model.create(payload);
      syncContentDomain(contentDomain, 'create');
      return this.getById(doc._id);
    },

    async update(id, data, userId) {
      const payload = userId ? withAuditOnUpdate(data, userId) : data;
      const doc = await Model.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      });

      if (!doc) {
        throw new AppError(`${Model.modelName} not found`, 404, 'NOT_FOUND');
      }

      syncContentDomain(contentDomain, 'update');
      return this.getById(id);
    },

    async setStatus(id, status, userId) {
      return this.update(id, { status }, userId);
    },

    async remove(id) {
      const doc = await Model.findByIdAndDelete(id);

      if (!doc) {
        throw new AppError(`${Model.modelName} not found`, 404, 'NOT_FOUND');
      }

      syncContentDomain(contentDomain, 'delete');
      return { id, deleted: true };
    },
  };
}

import { CONTENT_DOMAINS } from '../contentSyncService.js';

export const examAdmin = crudHandlers(Exam, {
  searchFilter: (query) => (query.category ? { category: query.category } : {}),
  contentDomain: CONTENT_DOMAINS.EXAMS,
});

export const courseAdmin = crudHandlers(Course, {
  searchFilter: (query) => (query.subject ? { subject: { $regex: query.subject, $options: 'i' } } : {}),
  contentDomain: CONTENT_DOMAINS.COURSES,
});

export const currentAffairAdmin = crudHandlers(CurrentAffair, {
  searchFilter: (query) => (query.category ? { category: query.category } : {}),
  contentDomain: CONTENT_DOMAINS.CURRENT_AFFAIRS,
});

export const mentorAdmin = crudHandlers(Mentor, {
  populate: { path: 'userId', select: 'name email phone' },
  useTextSort: false,
  withAudit: false,
  textSearch: false,
  searchFilter: (query) => {
    if (!query.q) {
      return {};
    }
    const regex = new RegExp(query.q.trim(), 'i');
    return { $or: [{ expertise: regex }, { bio: regex }] };
  },
});
