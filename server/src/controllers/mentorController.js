import * as mentorService from '../services/mentorService.js';

export async function listMentors(req, res) {
  const result = await mentorService.listMentors(req.query);
  res.status(200).json(result);
}

export async function getMentor(req, res) {
  const result = await mentorService.getMentorById(req.params.id);
  res.status(200).json(result);
}

export async function bookMentor(req, res) {
  const result = await mentorService.bookMentor(req.user._id, req.params.id, req.body.slotStart);
  res.status(201).json(result);
}
