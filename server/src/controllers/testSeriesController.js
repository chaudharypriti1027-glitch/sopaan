import * as testSeriesService from '../services/testSeriesService.js';

export async function listTestSeries(req, res) {
  const result = await testSeriesService.listTestSeries(req.query, req.user._id);
  res.status(200).json(result);
}

export async function getTestSeries(req, res) {
  const result = await testSeriesService.getTestSeriesById(req.params.id, req.user._id);
  res.status(200).json(result);
}

export async function enrollTestSeries(req, res) {
  const result = await testSeriesService.enrollInTestSeries(req.params.id, req.user._id);
  res.status(200).json(result);
}
