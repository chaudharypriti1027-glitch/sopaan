import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { CourseProgress } from '../models/CourseProgress.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { publishedContentFilter } from '../models/publishableFields.js';
import { buildContentLanguageQuery } from '../utils/resolveLanguage.js';
import { upsertHomeProgress } from './home/upsertHomeProgress.js';

function computeProgressPercent(completedCount, totalLessons) {
  if (!totalLessons) {
    return 0;
  }

  return Math.round((completedCount / totalLessons) * 100);
}

export async function listCourses(query, userId) {
  const { limit, offset } = parsePagination(query);
  const languageFilter = buildContentLanguageQuery(query.language);
  const filters = { ...publishedContentFilter, ...languageFilter };

  const [courses, total] = await Promise.all([
    Course.find(filters)
      .select('title subject examTags isFree thumbnailColor lessons')
      .sort({ title: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Course.countDocuments(filters),
  ]);

  let progressByCourse = new Map();

  if (userId) {
    const courseIds = courses.map((course) => course._id);
    const progressDocs = await CourseProgress.find({
      userId,
      courseId: { $in: courseIds },
    }).lean();

    progressByCourse = new Map(
      progressDocs.map((progress) => [progress.courseId.toString(), progress.progressPercent ?? 0])
    );
  }

  const items = courses.map((course) => ({
    ...course,
    lessonCount: course.lessons?.length ?? 0,
    progressPercent: progressByCourse.get(course._id.toString()) ?? 0,
    lessons: undefined,
  }));

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function getCourseById(id, userId) {
  const course = await Course.findOne({ $and: [{ _id: id }, publishedContentFilter] }).lean();

  if (!course) {
    throw new AppError('Course not found', 404, 'NOT_FOUND');
  }

  let progress = null;

  if (userId) {
    progress = await CourseProgress.findOne({ userId, courseId: id }).lean();
  }

  return {
    ...course,
    progress: progress
      ? {
          completedLessons: progress.completedLessons,
          lastLessonId: progress.lastLessonId,
          progressPercent: progress.progressPercent,
          updatedAt: progress.updatedAt,
        }
      : null,
  };
}

export async function updateCourseProgress(userId, courseId, { lessonId, completed }) {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new AppError('Course not found', 404, 'NOT_FOUND');
  }

  const lessonExists = course.lessons.some((lesson) => lesson._id.toString() === lessonId);

  if (!lessonExists) {
    throw new AppError('Lesson not found in this course', 404, 'NOT_FOUND');
  }

  // Atomic upsert avoids a find-then-create race on the unique (userId, courseId)
  // index when duplicate/retried requests land close together (e.g. flaky network retries).
  let progress = await CourseProgress.findOneAndUpdate(
    { userId, courseId },
    { $setOnInsert: { userId, courseId, completedLessons: [] } },
    { upsert: true, new: true },
  );

  const lessonObjectId = course.lessons.id(lessonId)._id;
  const completedSet = new Set(progress.completedLessons.map((id) => id.toString()));

  if (completed) {
    completedSet.add(lessonObjectId.toString());
    progress.lastLessonId = lessonObjectId;
  } else {
    completedSet.delete(lessonObjectId.toString());
  }

  progress.completedLessons = [...completedSet].map((id) => new mongoose.Types.ObjectId(id));
  progress.progressPercent = computeProgressPercent(
    progress.completedLessons.length,
    course.lessons.length
  );

  await progress.save();

  await upsertHomeProgress(userId, {
    kind: 'lesson',
    refId: course._id,
    title: course.title,
    subtitle: course.subject ?? '',
    progressPct: progress.progressPercent,
    accent: 'teal',
    deeplink: `/stack/CourseDetail/${courseId}`,
  });

  return {
    courseId,
    completedLessons: progress.completedLessons,
    lastLessonId: progress.lastLessonId,
    progressPercent: progress.progressPercent,
    updatedAt: progress.updatedAt,
  };
}
