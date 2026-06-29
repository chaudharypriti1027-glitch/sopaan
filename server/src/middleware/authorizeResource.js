import mongoose from 'mongoose';
import { Attempt } from '../models/Attempt.js';
import { PlannerSession } from '../models/PlannerSession.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

function assertObjectId(value) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid resource id', 400, 'VALIDATION_ERROR');
  }
}

export async function requireAttemptOwner(req, _res, next) {
  try {
    assertObjectId(req.params.id);
    const attempt = await Attempt.findById(req.params.id).select('userId').lean();

    if (!attempt || attempt.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    req.resource = attempt;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requirePlannerSessionOwner(req, _res, next) {
  try {
    assertObjectId(req.params.id);
    const session = await PlannerSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('_id userId');

    if (!session) {
      throw new AppError('Planner session not found', 404, 'NOT_FOUND');
    }

    req.resource = session;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireNotificationOwner(req, _res, next) {
  try {
    assertObjectId(req.params.id);
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('_id userId');

    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    req.resource = notification;
    next();
  } catch (err) {
    next(err);
  }
}
