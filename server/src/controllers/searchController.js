import * as searchService from '../services/searchService.js';

export async function search(req, res) {
  const result = await searchService.searchAll(req.query.q, {
    limit: Number(req.query.limit) || 8,
  });
  res.status(200).json(result);
}
