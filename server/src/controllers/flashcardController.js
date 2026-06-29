import * as flashcardService from '../services/flashcardService.js';
import * as reviewService from '../services/flashcards/reviewService.js';

export async function listDecks(req, res) {
  const result = await flashcardService.listDecks(req.query);
  res.status(200).json(result);
}

export async function getDueCards(req, res) {
  const result = await reviewService.getDueCards(req.user._id, req.query);
  res.status(200).json(result);
}

export async function getDueCount(req, res) {
  const result = await reviewService.countDueCards(req.user._id);
  res.status(200).json(result);
}

export async function reviewCard(req, res) {
  const review = await reviewService.reviewCard(req.user._id, req.body.cardId, req.body.rating);
  res.status(200).json({ review });
}

export async function getDeckDueCounts(req, res) {
  const counts = await reviewService.getDeckDueCounts(req.user._id);
  res.status(200).json({ counts });
}
