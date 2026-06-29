import { PlannerSession } from '../models/PlannerSession.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { AppError } from '../utils/AppError.js';
import { endOfDay, startOfDay, buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { buildAdaptiveDayPlan } from './planner/plannerEngine.js';
import { createNotification, PUSH_TYPES } from './notificationService.js';

function parseDate(dateStr) {
  return startOfDay(dateStr);
}

export async function listSessions(userId, dateStr, query = {}) {
  const date = parseDate(dateStr);
  const { limit, offset } = parsePagination(query, { defaultLimit: 50, maxLimit: 100 });

  const filter = {
    userId,
    date: { $gte: date, $lte: endOfDay(date) },
  };

  const [items, total] = await Promise.all([
    PlannerSession.find(filter).sort({ startTime: 1 }).skip(offset).limit(limit).lean(),
    PlannerSession.countDocuments(filter),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function createSession(userId, data) {
  return PlannerSession.create({
    userId,
    date: parseDate(data.date),
    startTime: data.startTime,
    durationMin: data.durationMin,
    subject: data.subject,
    topic: data.topic,
    type: data.type,
    reason: data.reason,
    motivation: data.motivation,
    completed: data.completed ?? false,
  });
}

export async function updateSession(userId, sessionId, updates) {
  const session = await PlannerSession.findOne({ _id: sessionId, userId });

  if (!session) {
    throw new AppError('Planner session not found', 404, 'NOT_FOUND');
  }

  if (updates.date) {
    session.date = parseDate(updates.date);
  }

  for (const field of [
    'startTime',
    'durationMin',
    'subject',
    'topic',
    'type',
    'reason',
    'motivation',
    'completed',
  ]) {
    if (updates[field] !== undefined) {
      session[field] = updates[field];
    }
  }

  await session.save();
  return session;
}

export async function generatePlan(userId, dateStr, { replaceExisting = true } = {}) {
  const date = dateStr ? parseDate(dateStr) : startOfDay(new Date());
  const plan = await buildAdaptiveDayPlan(userId, { date });

  if (replaceExisting) {
    await PlannerSession.deleteMany({
      userId,
      date: { $gte: date, $lte: endOfDay(date) },
    });
  }

  const createdSessions = await Promise.all(
    plan.sessions.map((session) =>
      PlannerSession.create({
        userId,
        date,
        startTime: session.startTime,
        durationMin: session.durationMin,
        subject: session.subject,
        topic: session.topic,
        type: session.type,
        reason: session.reason,
        motivation: session.motivation,
        completed: session.completed ?? false,
      })
    )
  );

  const dateLabel = date.toISOString().slice(0, 10);

  await createNotification(userId, {
    type: PUSH_TYPES.PLAN_READY,
    title: 'Your study plan is ready',
    body: plan.summary ?? `Adaptive plan scheduled for ${dateLabel}.`,
    data: { date: dateLabel },
  });

  return {
    date,
    summary: plan.summary,
    sessions: createdSessions,
    meta: plan.meta,
  };
}

export async function generatePlansForActiveStudents(dateStr) {
  const date = dateStr ? parseDate(dateStr) : startOfDay(new Date());
  const dateLabel = date.toISOString().slice(0, 10);

  const profiles = await StudentProfile.find({
    'preferences.dailyGoalMinutes': { $gt: 0 },
    'goal.examTrack': { $exists: true, $ne: '' },
  })
    .select('userId')
    .limit(500)
    .lean();

  let generated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const existing = await PlannerSession.countDocuments({
      userId: profile.userId,
      date: { $gte: date, $lte: endOfDay(date) },
    });

    if (existing > 0) {
      skipped += 1;
      continue;
    }

    try {
      await generatePlan(profile.userId, dateLabel, { replaceExisting: false });
      generated += 1;
    } catch (err) {
      console.error(`[planner] failed for user ${profile.userId}:`, err.message);
    }
  }

  return { generated, skipped, date: dateLabel };
}
