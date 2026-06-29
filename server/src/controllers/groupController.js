import * as groupService from '../services/groupService.js';

export async function listGroups(req, res) {
  const result = await groupService.listGroups(req.query);
  res.status(200).json(result);
}

export async function createGroup(req, res) {
  const result = await groupService.createGroup(req.user._id, req.body);
  res.status(201).json(result);
}

export async function joinGroup(req, res) {
  const result = await groupService.joinGroup(req.user._id, req.params.id);
  res.status(200).json(result);
}
