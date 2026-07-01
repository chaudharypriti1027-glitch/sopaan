import { FlashcardReview } from '../../models/FlashcardReview.js';
import { collectAllCards } from '../flashcardService.js';
import { applySm2Review, isDue, ratingToGrade, SM2_INITIAL } from './sm2.js';
import { buildPaginatedResult, parsePagination } from '../../utils/pagination.js';

export async function reviewCard(userId, cardId, rating) {
  const grade = ratingToGrade(rating);
  const existing = await FlashcardReview.findOne({ userId, cardId });
  const current = existing
    ? {
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
      }
    : SM2_INITIAL;

  const next = applySm2Review(current, grade);
  const now = new Date();

  if (existing) {
    existing.easeFactor = next.easeFactor;
    existing.intervalDays = next.intervalDays;
    existing.repetitions = next.repetitions;
    existing.dueDate = next.dueDate;
    existing.lastReviewedAt = now;
    await existing.save();
    return existing.toObject();
  }

  // Atomic upsert avoids a find-then-create race on the unique (userId, cardId)
  // index if the same review is submitted twice in quick succession.
  const created = await FlashcardReview.findOneAndUpdate(
    { userId, cardId },
    {
      $setOnInsert: {
        userId,
        cardId,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueDate: next.dueDate,
        lastReviewedAt: now,
      },
    },
    { upsert: true, new: true },
  );

  return created.toObject();
}

export async function getDueCards(userId, query = {}, now = new Date()) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const allCards = await collectAllCards({ limit: 500 });
  const cardIds = allCards.map((card) => card.id);

  const reviews = await FlashcardReview.find({
    userId,
    cardId: { $in: cardIds },
  }).lean();

  const reviewMap = new Map(reviews.map((review) => [review.cardId, review]));
  const dueItems = [];

  for (const card of allCards) {
    const review = reviewMap.get(card.id);
    const dueDate = review?.dueDate ?? new Date(0);

    if (!review || isDue(dueDate, now)) {
      dueItems.push({
        ...card,
        dueDate,
        review: review
          ? {
              easeFactor: review.easeFactor,
              intervalDays: review.intervalDays,
              repetitions: review.repetitions,
              dueDate: review.dueDate,
            }
          : null,
      });
    }
  }

  dueItems.sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());

  const pageItems = dueItems.slice(offset, offset + limit);

  return {
    count: dueItems.length,
    ...buildPaginatedResult({
      items: pageItems,
      total: dueItems.length,
      limit,
      offset,
    }),
  };
}

export async function countDueCards(userId, now = new Date()) {
  const { count } = await getDueCards(userId, { limit: 1, offset: 0 }, now);
  return { count };
}

export async function getDeckDueCounts(userId, now = new Date()) {
  const { items } = await getDueCards(userId, { limit: 500, offset: 0 }, now);
  const counts = {};

  for (const item of items) {
    counts[item.deckId] = (counts[item.deckId] ?? 0) + 1;
  }

  return counts;
}
