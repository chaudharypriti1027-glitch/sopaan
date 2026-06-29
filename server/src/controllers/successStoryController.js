import * as successStoryService from '../services/successStoryService.js';

export async function listSuccessStories(_req, res) {
  res.status(200).json(successStoryService.listSuccessStories());
}
