import * as currentAffairService from '../services/currentAffairService.js';
import {
  getDigestForDate,
  getTodayDigest as loadTodayDigest,
} from '../services/currentAffairs/currentAffairDigestService.js';
import { getValidatedQuery } from '../middleware/validate.js';
import { AppError } from '../utils/AppError.js';

export async function listCurrentAffairs(req, res) {
  const result = await currentAffairService.listCurrentAffairs(getValidatedQuery(req));
  res.status(200).json(result);
}

export async function getCurrentAffair(req, res) {
  const result = await currentAffairService.getCurrentAffairById(req.params.id);
  res.status(200).json(result);
}

export async function getTodayDigest(req, res) {
  const digest = await loadTodayDigest(getValidatedQuery(req));

  if (!digest) {
    throw new AppError('No digest published for today yet', 404, 'NOT_FOUND');
  }

  res.status(200).json(digest);
}

export async function getDigestByDate(req, res) {
  const query = getValidatedQuery(req);
  const digest = await getDigestForDate(
    query.date ? new Date(`${query.date}T00:00:00`) : new Date(),
    query,
  );

  if (!digest) {
    throw new AppError('Digest not found for that date', 404, 'NOT_FOUND');
  }

  res.status(200).json(digest);
}

export async function getAffairStudyPack(req, res) {
  const result = await currentAffairService.getAffairStudyPack(req.params.id);
  res.status(200).json(result);
}

export async function getAffairQuizGame(req, res) {
  const result = await currentAffairService.getAffairQuizGame(req.params.id);
  res.status(200).json(result);
}

export async function getAffairAiSummary(req, res) {
  const query = getValidatedQuery(req);
  const result = await currentAffairService.getAffairAiSummary(req.params.id, {
    language: query.language ?? 'en',
  });
  res.status(200).json(result);
}
