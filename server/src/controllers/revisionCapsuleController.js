import * as revisionCapsuleService from '../services/revisionCapsuleService.js';

export async function listRevisionCapsules(req, res) {
  const result = await revisionCapsuleService.listRevisionCapsules({
    ...req.query,
    language: req.query.language ?? req.language,
  });
  res.status(200).json(result);
}
