import * as bookGenService from '../services/bookGenService.js';

export async function generateAdminBook(req, res) {
  const result = await bookGenService.createBookGenerationJob(req.body, req.user);
  res.status(202).json(result);
}

export async function getAdminBookGenStatus(req, res) {
  const status = await bookGenService.getBookGenJobStatus(req.params.jobId, req.user);
  res.json(status);
}

export async function publishAdminBook(req, res) {
  const book = await bookGenService.publishBook(req.params.id, req.user);
  res.json({ book });
}
