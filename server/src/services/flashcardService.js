import { RevisionCapsule } from '../models/RevisionCapsule.js';
import { VocabularyWord } from '../models/VocabularyWord.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';

function slugifySubject(subject) {
  return subject.toLowerCase().replace(/\s+/g, '-');
}

async function loadDeckSummaries() {
  const [capsuleGroups, vocabCount] = await Promise.all([
    RevisionCapsule.aggregate([
      {
        $group: {
          _id: '$subject',
          cardCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    VocabularyWord.countDocuments({}),
  ]);

  const decks = capsuleGroups.map((group) => ({
    id: slugifySubject(group._id ?? 'General'),
    title: group._id ?? 'General',
    cardCount: group.cardCount,
    source: 'capsule',
  }));

  if (vocabCount > 0) {
    decks.push({
      id: 'vocabulary',
      title: 'Vocabulary',
      cardCount: vocabCount,
      source: 'vocabulary',
    });
  }

  return decks;
}

export async function listDecks(query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const cacheKey = stableCacheKey('cache:flashcard:decks', { limit, offset });

  return cacheGetOrSet(cacheKey, CACHE_TTLS.flashcardDecksSec, async () => {
    const allDecks = await loadDeckSummaries();
    const items = allDecks.slice(offset, offset + limit);

    return buildPaginatedResult({
      items,
      total: allDecks.length,
      limit,
      offset,
    });
  });
}

export async function collectAllCards({ deckId, limit = 200, offset = 0 } = {}) {
  const cards = [];

  if (!deckId || deckId === 'vocabulary') {
    const words = await VocabularyWord.find({})
      .select('word meaning example subject')
      .sort({ date: -1 })
      .skip(deckId === 'vocabulary' ? offset : 0)
      .limit(deckId === 'vocabulary' ? limit : 50)
      .lean();

    for (const word of words) {
      cards.push({
        id: word._id.toString(),
        deckId: 'vocabulary',
        deckTitle: 'Vocabulary',
        front: word.word,
        back: `${word.meaning}${word.example ? `\n"${word.example}"` : ''}`,
        source: 'vocabulary',
      });
    }
  }

  if (!deckId || deckId !== 'vocabulary') {
    const capsuleFilter = deckId
      ? { subject: new RegExp(`^${deckId.replace(/-/g, ' ')}$`, 'i') }
      : {};

    const capsules = await RevisionCapsule.find(capsuleFilter)
      .select('title subject body')
      .sort({ title: 1 })
      .skip(deckId ? offset : 0)
      .limit(deckId ? limit : 200)
      .lean();

    for (const capsule of capsules) {
      const subject = capsule.subject ?? 'General';
      cards.push({
        id: capsule._id.toString(),
        deckId: slugifySubject(subject),
        deckTitle: subject,
        front: capsule.title,
        back: capsule.body.replace(/[#*`$]/g, '').slice(0, 280),
        source: 'capsule',
      });
    }
  }

  return cards;
}
