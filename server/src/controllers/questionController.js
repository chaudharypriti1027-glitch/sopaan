import { getValidatedQuery } from '../middleware/validate.js';
import {
  formatQuestionPreview,
  getQuestionById,
  getRelatedQuestions,
} from '../services/semantic/questionSemanticService.js';

export async function getQuestionHandler(req, res) {
  const question = await getQuestionById(req.params.id);
  res.status(200).json(formatQuestionPreview(question));
}

export async function getRelatedQuestionsHandler(req, res) {
  const query = getValidatedQuery(req);
  const related = await getRelatedQuestions(req.params.id, {
    limit: query.limit,
  });

  res.status(200).json({ related });
}
