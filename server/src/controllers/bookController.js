import * as bookService from '../services/bookService.js';

export async function listBooks(req, res) {
  const result = await bookService.listBooks(req.query);
  res.status(200).json(result);
}
