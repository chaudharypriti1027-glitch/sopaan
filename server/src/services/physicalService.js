import { PhysicalLog } from '../models/PhysicalLog.js';
import { buildPaginatedResult, parsePagination, startOfDay } from '../utils/pagination.js';

const PHYSICAL_STANDARDS = {
  'Police SI': [
    { testType: '1.6km_run', label: '1.6 km run', unit: 'min', targetMax: 7.0 },
    { testType: 'long_jump', label: 'Long jump', unit: 'm', targetMin: 3.65 },
    { testType: 'high_jump', label: 'High jump', unit: 'm', targetMin: 1.15 },
  ],
  'Delhi Police Constable': [
    { testType: '1.6km_run', label: '1.6 km run', unit: 'min', targetMax: 8.0 },
    { testType: 'long_jump', label: 'Long jump', unit: 'm', targetMin: 3.5 },
  ],
  Defence: [
    { testType: '1.6km_run', label: '1.6 km run', unit: 'min', targetMax: 6.5 },
    { testType: 'push_ups', label: 'Push-ups (2 min)', unit: 'count', targetMin: 30 },
    { testType: 'sit_ups', label: 'Sit-ups (2 min)', unit: 'count', targetMin: 35 },
  ],
  default: [
    { testType: '1.6km_run', label: '1.6 km run', unit: 'min', targetMax: 8.0 },
    { testType: 'long_jump', label: 'Long jump', unit: 'm', targetMin: 3.0 },
  ],
};

export function getStandards(goal) {
  if (!goal) {
    return PHYSICAL_STANDARDS.default;
  }

  const match = Object.entries(PHYSICAL_STANDARDS).find(([key]) =>
    goal.toLowerCase().includes(key.toLowerCase())
  );

  return match?.[1] ?? PHYSICAL_STANDARDS.default;
}

export async function listLogs(userId, query) {
  const { limit, offset } = parsePagination(query);
  const filters = { userId };

  if (query.testType) {
    filters.testType = query.testType;
  }

  const [items, total] = await Promise.all([
    PhysicalLog.find(filters).sort({ date: -1 }).skip(offset).limit(limit).lean(),
    PhysicalLog.countDocuments(filters),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function createLog(userId, { testType, value, unit, date }) {
  const log = await PhysicalLog.create({
    userId,
    testType,
    value,
    unit,
    date: date ? startOfDay(date) : startOfDay(new Date()),
  });

  return log;
}

export async function getFitnessPlan(userId, goal) {
  const standards = getStandards(goal);
  const logs = await PhysicalLog.find({ userId }).sort({ date: -1 }).limit(30).lean();

  const latestByType = new Map();
  for (const log of logs) {
    if (!latestByType.has(log.testType)) {
      latestByType.set(log.testType, log);
    }
  }

  const comparisons = standards.map((standard) => {
    const log = latestByType.get(standard.testType);
    let status = 'missing';
    let gap = null;

    if (log) {
      if (standard.targetMax != null) {
        status = log.value <= standard.targetMax ? 'met' : 'below';
        gap = Math.round((log.value - standard.targetMax) * 100) / 100;
      } else if (standard.targetMin != null) {
        status = log.value >= standard.targetMin ? 'met' : 'below';
        gap = Math.round((standard.targetMin - log.value) * 100) / 100;
      }
    }

    return {
      ...standard,
      latest: log ? { value: log.value, unit: log.unit, date: log.date } : null,
      status,
      gap,
    };
  });

  const plan = comparisons.flatMap((item) => {
    if (item.status === 'met') {
      return [`Maintain ${item.label} — you're meeting the benchmark.`];
    }
    if (item.status === 'below' && item.gap != null) {
      return [`Improve ${item.label}: close a gap of ${item.gap} ${item.unit}.`];
    }
    return [`Log your ${item.label} result to track progress.`];
  });

  return {
    goal: goal ?? 'default',
    standards: comparisons,
    plan: plan.slice(0, 6),
  };
}
