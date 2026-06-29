import * as focusService from '../services/focusService.js';

export async function logFocus(req, res) {
  const result = await focusService.logFocus(req.user._id, {
    focusMinutes: req.body.focusMinutes,
    breaksTaken: req.body.breaksTaken,
    sessions: req.body.sessions,
    date: req.body.date,
  });
  res.status(200).json(result);
}
