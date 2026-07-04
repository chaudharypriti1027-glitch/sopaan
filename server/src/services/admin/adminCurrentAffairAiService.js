import { CurrentAffair } from '../../models/CurrentAffair.js';
import { Question } from '../../models/Question.js';
import { AppError } from '../../utils/AppError.js';
import { withAuditOnUpdate } from '../../models/publishableFields.js';
import { summarizeForAspirants } from '../ai/summarizeForAspirants.js';
import { currentAffairAdmin } from './adminCrudService.js';

const CATEGORY_COLORS = {
  National: '#3B82F6',
  International: '#6366F1',
  Economy: '#F59E0B',
  Polity: '#8B5CF6',
  Science: '#10B981',
  Defence: '#64748B',
  Schemes: '#EC4899',
  Sports: '#14B8A6',
  Environment: '#22C55E',
  Other: '#94A3B8',
};

export async function enrichCurrentAffairWithAi(id, userId) {
  const affair = await CurrentAffair.findById(id);

  if (!affair) {
    throw new AppError('CurrentAffair not found', 404, 'NOT_FOUND');
  }

  const aiResult = await summarizeForAspirants({
    title: affair.title,
    snippet: affair.summary?.trim() || affair.title,
    sourceName: affair.source || 'Sopaan Admin',
    sourceUrl: affair.sourceUrl,
    publishedAt: affair.publishedAt,
    language: 'en',
  });

  const questionDocs = await Question.insertMany(
    aiResult.quizQuestions.map((question) => ({
      subject: 'Current Affairs',
      topic: question.topic,
      difficulty: question.difficulty,
      text: question.text,
      options: question.options.map((option) => ({
        key: option.key.toUpperCase(),
        text: option.text,
      })),
      correctKey: question.correctKey.toUpperCase(),
      explanation: question.explanation,
      examTags: ['General'],
      source: 'official',
      language: 'en',
      reviewStatus: 'approved',
      qualityCheckedAt: new Date(),
      createdBy: userId,
    })),
  );

  affair.summary = aiResult.summary;
  affair.category = aiResult.category || affair.category;
  affair.imageColor = CATEGORY_COLORS[aiResult.category] ?? affair.imageColor;
  affair.quizQuestions = questionDocs.map((doc) => doc._id);
  affair.set(withAuditOnUpdate({}, userId));
  await affair.save();

  return currentAffairAdmin.getById(id);
}
