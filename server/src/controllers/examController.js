import * as examService from '../services/examService.js';

export async function listExams(req, res) {
  const result = await examService.listExams(req.query);
  res.status(200).json(result);
}

export async function getExam(req, res) {
  const result = await examService.getExamById(req.params.id);
  res.status(200).json(result);
}

export async function getCalendar(req, res) {
  const result = await examService.getExamCalendar(req.query);
  res.status(200).json(result);
}
