import * as friendService from '../services/friendService.js';

export async function searchStudents(req, res) {
  const result = await friendService.searchStudents(req.user._id, req.query);
  res.status(200).json(result);
}

export async function listFriends(req, res) {
  const result = await friendService.listFriends(req.user._id, req.query);
  res.status(200).json(result);
}

export async function listFriendRequests(req, res) {
  const result = await friendService.listFriendRequests(req.user._id, req.query);
  res.status(200).json(result);
}

export async function sendFriendRequest(req, res) {
  const result = await friendService.sendFriendRequest(req.user._id, req.body.userId);
  res.status(201).json(result);
}

export async function respondFriendRequest(req, res) {
  const result = await friendService.respondFriendRequest(
    req.user._id,
    req.params.id,
    req.body.action,
  );
  res.status(200).json(result);
}

export async function removeFriend(req, res) {
  const result = await friendService.removeFriend(req.user._id, req.params.userId);
  res.status(200).json(result);
}
