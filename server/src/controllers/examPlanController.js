import * as examPlanService from '../services/examPlanService.js';

export async function getExamPlan(req, res) {
  const result = await examPlanService.getExamPlan(req.user._id);
  res.status(200).json(result);
}
