import { Mentor } from '../models/Mentor.js';
import { MentorBooking } from '../models/MentorBooking.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { caseInsensitiveRegex } from '../utils/regex.js';

export async function listMentors(query) {
  const { limit, offset } = parsePagination(query);
  const filters = {};

  if (query.expertise) {
    filters.expertise = caseInsensitiveRegex(query.expertise);
  }

  const [items, total] = await Promise.all([
    Mentor.find(filters)
      .populate('userId', 'name')
      .sort({ rating: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Mentor.countDocuments(filters),
  ]);

  return buildPaginatedResult({
    items: items.map((mentor) => ({
      ...mentor,
      availableSlots: (mentor.slots ?? []).filter((slot) => !slot.isBooked && new Date(slot.start) > new Date()),
    })),
    total,
    limit,
    offset,
  });
}

export async function getMentorById(mentorId) {
  const mentor = await Mentor.findById(mentorId).populate('userId', 'name email').lean();

  if (!mentor) {
    throw new AppError('Mentor not found', 404, 'NOT_FOUND');
  }

  return {
    ...mentor,
    availableSlots: (mentor.slots ?? []).filter((slot) => !slot.isBooked && new Date(slot.start) > new Date()),
  };
}

export async function bookMentor(studentId, mentorId, slotStartInput) {
  const mentor = await Mentor.findById(mentorId);

  if (!mentor) {
    throw new AppError('Mentor not found', 404, 'NOT_FOUND');
  }

  const slotStart = new Date(slotStartInput);
  const slot = mentor.slots.find(
    (item) => new Date(item.start).getTime() === slotStart.getTime() && !item.isBooked
  );

  if (!slot) {
    throw new AppError('Slot not available', 400, 'SLOT_UNAVAILABLE');
  }

  slot.isBooked = true;
  mentor.sessionsCount = (mentor.sessionsCount ?? 0) + 1;
  await mentor.save();

  const booking = await MentorBooking.create({
    mentorId,
    studentId,
    slotStart,
    status: 'booked',
  });

  const mentorUser = await User.findById(mentor.userId);
  await createNotification(studentId, {
    type: 'mentor',
    title: 'Mentor session booked',
    body: `Your session with ${mentorUser?.name ?? 'mentor'} is confirmed.`,
  });

  return booking;
}
