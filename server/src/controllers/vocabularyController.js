import * as vocabularyService from '../services/vocabularyService.js';

export async function getTodaysVocabulary(req, res) {
  const result = await vocabularyService.getTodaysVocabulary();
  res.status(200).json(result);
}

export async function listRecentVocabulary(req, res) {
  const result = await vocabularyService.listRecentVocabulary(req.query);
  res.status(200).json(result);
}
