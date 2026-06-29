import * as communityTestService from '../services/communityTestService.js';

export async function createCommunityTest(req, res) {
  const result = await communityTestService.createCommunityTest(req.user._id, req.body);
  res.status(201).json(result);
}

export async function listCommunityTests(req, res) {
  const result = await communityTestService.listCommunityTests(req.query, req.user._id);
  res.status(200).json(result);
}
