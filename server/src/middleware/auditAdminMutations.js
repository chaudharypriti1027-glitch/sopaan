import { writeAuditLog } from '../services/auditService.js';
import { logger } from '../observability/logger.js';
import { scheduleAdminDashboardBroadcast } from '../realtime/adminDashboardBroadcast.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const COUNTERS_RESOURCES = new Set(['tests', 'questions', 'live-classes']);

function parseAdminAudit(req) {
  const segments = req.path.split('/').filter(Boolean);
  const resource = segments[0] ?? 'admin';
  const resourceId = req.params?.id ?? req.params?.jobName ?? null;

  const actionMap = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };

  let action = actionMap[req.method] ?? req.method.toLowerCase();

  if (resource === 'generate-exam' && req.method === 'POST') {
    action = 'generate';
  } else if (resource === 'notifications' && segments[1] === 'broadcast') {
    action = 'broadcast';
  } else if (resource === 'notifications' && req.method === 'POST' && !segments[1]) {
    action = 'send_notification';
  } else if (resource === 'jobs' && segments[2] === 'run') {
    action = 'run_job';
  } else if (resource === 'questions' && segments[1] === 'import') {
    action = 'import';
  } else if (resource === 'tests' && segments[2] === 'review') {
    action = 'review';
  } else if (resource === 'questions' && segments[2] === 'review') {
    action = 'review';
  } else if (resource === 'questions' && segments[2] === 'merge') {
    action = 'merge';
  } else if (resource === 'ai-feedback') {
    action = 'review';
  } else if (resource === 'transactions' && segments[2] === 'refund') {
    action = 'refund';
  } else if (resource === 'transactions' && segments[2] === 'remind') {
    action = 'remind';
  } else if (resource === 'live-classes' && segments[2] === 'start') {
    action = 'start';
  } else if (resource === 'live-classes' && segments[2] === 'end') {
    action = 'end';
  } else if (resource === 'announcements' && req.method === 'POST') {
    action = 'publish';
  } else if (resource === 'team' && segments[1] === 'invite') {
    action = 'invite';
  } else if (resource === 'team' && segments[2] === 'role') {
    action = 'role_change';
  } else if (resource === 'audit' && segments[1] === 'test') {
    action = 'test';
  }

  return { action, resource, resourceId: resourceId ? String(resourceId) : null };
}

async function recordMutationAudit(req, res, body) {
  if (res.statusCode < 200 || res.statusCode >= 300 || !req.user?._id) {
    return body;
  }

  const { action, resource, resourceId } = parseAdminAudit(req);

  try {
    await writeAuditLog({
      actor: req.user._id,
      action,
      resource,
      resourceId,
      meta: {
        method: req.method,
        path: req.originalUrl,
      },
    });
  } catch (err) {
    logger.warn('audit log write failed', {
      err: err.message,
      path: req.originalUrl,
      userId: String(req.user._id),
    });
  }

  if (COUNTERS_RESOURCES.has(resource)) {
    scheduleAdminDashboardBroadcast();
  }

  return body;
}

export function auditAdminMutations(req, res, next) {
  if (!MUTATION_METHODS.has(req.method)) {
    return next();
  }

  let recorded = false;

  async function recordOnce(body) {
    if (recorded) return body;
    recorded = true;
    return recordMutationAudit(req, res, body);
  }

  const originalJson = res.json.bind(res);

  res.json = function auditedJson(body) {
    return recordOnce(body).then((payload) => originalJson(payload));
  };

  next();
}
