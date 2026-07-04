import { AuditLog } from '../models/AuditLog.js';

/**
 * @param {{
 *   actor: import('mongoose').Types.ObjectId | string;
 *   action: string;
 *   resource: string;
 *   resourceId?: string | null;
 *   meta?: Record<string, unknown> | null;
 * }} entry
 */
export async function writeAuditLog(entry) {
  return AuditLog.create({
    actor: entry.actor,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId ?? null,
    meta: entry.meta ?? null,
    at: new Date(),
  });
}

export async function listAuditLogs({ limit = 50, cursor } = {}) {
  const query = cursor ? { at: { $lt: new Date(cursor) } } : {};

  const items = await AuditLog.find(query)
    .sort({ at: -1 })
    .limit(Math.min(limit, 100))
    .populate('actor', 'name email role')
    .lean();

  return {
    items: items.map((row) => ({
      id: String(row._id),
      actor: row.actor
        ? {
            id: String(row.actor._id),
            name: row.actor.name,
            email: row.actor.email,
            role: row.actor.role,
          }
        : null,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      meta: row.meta,
      at: row.at,
    })),
    nextCursor: items.length ? items[items.length - 1].at.toISOString() : null,
  };
}
