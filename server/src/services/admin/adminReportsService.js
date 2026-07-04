import { User } from '../../models/User.js';
import { Attempt } from '../../models/Attempt.js';
import { Referral } from '../../models/Referral.js';
import { AiModelFeedback } from '../../models/AiModelFeedback.js';
import { subtractDays } from '../../utils/testHelpers.js';
import { getRevenueSummary } from './adminRevenueService.js';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function buildDaySeries(days, rows, valueKey = 'count') {
  const map = new Map(rows.map((row) => [row._id, row[valueKey] ?? 0]));
  const series = [];
  const today = startOfDay(new Date());

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = subtractDays(today, offset);
    const key = formatDayKey(day);
    series.push({
      date: key,
      label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: map.get(key) ?? 0,
    });
  }

  return series;
}

export async function getAdminReports() {
  const since14 = subtractDays(startOfDay(new Date()), 13);
  const since30 = subtractDays(new Date(), 30);

  const [
    attemptRows,
    signupRows,
    revenue,
    referralsTotal,
    referralsConverted,
    referralsPending,
    aiFeedbackPending,
    proStudents,
    signupsLast30Days,
  ] = await Promise.all([
    Attempt.aggregate([
      { $match: { createdAt: { $gte: since14 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    User.aggregate([
      { $match: { role: 'student', createdAt: { $gte: since14 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    getRevenueSummary(),
    Referral.countDocuments({}),
    Referral.countDocuments({ status: 'rewarded' }),
    Referral.countDocuments({ status: 'pending' }),
    AiModelFeedback.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'student', isPremium: true }),
    User.countDocuments({ role: 'student', createdAt: { $gte: since30 } }),
  ]);

  const attemptsDaily = buildDaySeries(14, attemptRows);
  const signupsDaily = buildDaySeries(14, signupRows);

  return {
    attemptsDaily,
    signupsDaily,
    revenue,
    referrals: {
      total: referralsTotal,
      converted: referralsConverted,
      pending: referralsPending,
    },
    aiFeedbackPending,
    proStudents,
    signupsLast30Days,
    generatedAt: new Date().toISOString(),
  };
}

export async function getAttemptsSeries(days = 14) {
  const capped = Math.min(Math.max(Number(days) || 14, 1), 90);
  const since = subtractDays(startOfDay(new Date()), capped - 1);

  const attemptRows = await Attempt.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    days: capped,
    series: buildDaySeries(capped, attemptRows),
  };
}

export async function getReferralSummary() {
  const [total, converted, pending, recent] = await Promise.all([
    Referral.countDocuments({}),
    Referral.countDocuments({ status: 'rewarded' }),
    Referral.countDocuments({ status: 'pending' }),
    Referral.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('referrerId', 'name email referralCode')
      .lean(),
  ]);

  return {
    summary: { total, converted, pending },
    items: recent.map((row) => ({
      id: row._id.toString(),
      referrerName: row.referrerId?.name ?? 'Student',
      referrerEmail: row.referrerId?.email ?? null,
      referralCode: row.code ?? row.referrerId?.referralCode ?? null,
      status: row.status,
      rewardCoins: row.referrerReward?.coins ?? 0,
      createdAt: row.createdAt,
    })),
  };
}
