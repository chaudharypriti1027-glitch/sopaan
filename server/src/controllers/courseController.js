import * as courseService from '../services/courseService.js';
import { recordActivity, ACTIVITY_KINDS } from '../services/activity.js';

export async function listCourses(req, res) {
  const result = await courseService.listCourses(
    { ...req.query, language: req.query.language ?? req.language },
    req.user?._id,
  );
  res.status(200).json(result);
}

export async function getCourse(req, res) {
  const result = await courseService.getCourseById(req.params.id, req.user?._id);
  res.status(200).json(result);
}

export async function updateProgress(req, res) {
  const result = await courseService.updateCourseProgress(req.user._id, req.params.id, req.body);

  if (req.body.completed) {
    await recordActivity(req.user, ACTIVITY_KINDS.LESSON_COMPLETE);
  }

  res.status(200).json(result);
}
