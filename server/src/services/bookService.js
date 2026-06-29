import { Exam } from '../models/Exam.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';

export async function listBooks(query) {
  const { limit, offset } = parsePagination(query);

  const pipeline = [
    { $unwind: '$recommendedBooks' },
    ...(query.subject
      ? [{ $match: { 'recommendedBooks.subject': { $regex: query.subject, $options: 'i' } } }]
      : []),
    {
      $project: {
        _id: 0,
        id: {
          $concat: [{ $toString: '$_id' }, '-', { $toString: '$recommendedBooks.title' }],
        },
        title: '$recommendedBooks.title',
        author: '$recommendedBooks.author',
        subject: '$recommendedBooks.subject',
        rating: '$recommendedBooks.rating',
        link: '$recommendedBooks.link',
        examId: '$_id',
        examName: '$name',
        examCode: '$code',
        category: '$category',
      },
    },
    { $sort: { subject: 1, title: 1 } },
    {
      $facet: {
        items: [{ $skip: offset }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Exam.aggregate(pipeline);
  const items = result?.items ?? [];
  const total = result?.total?.[0]?.count ?? 0;

  return buildPaginatedResult({ items, total, limit, offset });
}
