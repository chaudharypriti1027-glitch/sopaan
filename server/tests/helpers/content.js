import { Course } from '../../src/models/Course.js';

export async function createPublishedCourse(overrides = {}) {
  const lessonsInput = overrides.lessons ?? [{ title: 'Intro', order: 1 }];
  const lessons = lessonsInput.map((lesson, index) => ({
    title: lesson.title ?? `Lesson ${index + 1}`,
    order: lesson.order ?? index + 1,
    durationSec:
      lesson.durationSec ??
      (typeof lesson.durationMin === 'number' ? lesson.durationMin * 60 : undefined),
  }));

  const { lessons: _lessons, ...rest } = overrides;

  return Course.create({
    title: 'Fixture Course',
    subject: 'General',
    examTags: ['SSC-CGL'],
    language: 'en',
    status: 'published',
    lessons,
    ...rest,
  });
}
