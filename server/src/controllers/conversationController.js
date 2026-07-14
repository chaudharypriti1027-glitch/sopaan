import * as conversationService from '../services/conversationService.js';

export async function listConversations(req, res) {
  const result = await conversationService.listConversations(req.user._id, req.query);
  res.status(200).json(result);
}

export async function getOrCreateConversation(req, res) {
  const result = await conversationService.getOrCreateConversation(
    req.user._id,
    req.body.friendUserId,
  );
  res.status(200).json(result);
}

export async function listConversationMessages(req, res) {
  const result = await conversationService.listConversationMessages(
    req.user._id,
    req.params.id,
    req.query,
  );
  res.status(200).json(result);
}
