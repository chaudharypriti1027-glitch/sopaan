import { FriendRequest } from '../models/FriendRequest.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { caseInsensitiveRegex } from '../utils/regex.js';
import { createNotification } from './notificationService.js';
import {
  emitFriendRequestAccepted,
  emitFriendRequestNew,
} from '../realtime/userRealtime.js';

function sortParticipantIds(userIdA, userIdB) {
  const left = userIdA.toString();
  const right = userIdB.toString();
  return left < right ? [userIdA, userIdB] : [userIdB, userIdA];
}

export async function areFriends(userId, otherUserId) {
  if (!otherUserId || userId.toString() === otherUserId.toString()) {
    return false;
  }

  const friendship = await FriendRequest.findOne({
    status: 'accepted',
    $or: [
      { fromUser: userId, toUser: otherUserId },
      { fromUser: otherUserId, toUser: userId },
    ],
  })
    .select('_id')
    .lean();

  return Boolean(friendship);
}

function formatFriendUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    targetExam: user.targetExam ?? null,
  };
}

export async function searchStudents(userId, query) {
  const term = query.q?.trim();

  if (!term || term.length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400, 'VALIDATION_ERROR');
  }

  const { limit, offset } = parsePagination(query);

  const users = await User.find({
    _id: { $ne: userId },
    name: caseInsensitiveRegex(term),
  })
    .select('name avatarUrl targetExam')
    .sort({ name: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  const userIds = users.map((user) => user._id);
  const relations = await FriendRequest.find({
    $or: [
      { fromUser: userId, toUser: { $in: userIds } },
      { fromUser: { $in: userIds }, toUser: userId },
    ],
  })
    .select('fromUser toUser status')
    .lean();

  const relationByUser = new Map();

  for (const relation of relations) {
    const otherId =
      relation.fromUser.toString() === userId.toString()
        ? relation.toUser.toString()
        : relation.fromUser.toString();
    relationByUser.set(otherId, relation.status);
  }

  const items = users.map((user) => ({
    ...formatFriendUser(user),
    relationStatus: relationByUser.get(user._id.toString()) ?? null,
  }));

  return buildPaginatedResult({ items, total: items.length, limit, offset });
}

export async function sendFriendRequest(fromUserId, toUserId) {
  if (fromUserId.toString() === toUserId.toString()) {
    throw new AppError('You cannot add yourself', 400, 'VALIDATION_ERROR');
  }

  const target = await User.findById(toUserId).select('name').lean();

  if (!target) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  const existing = await FriendRequest.findOne({
    $or: [
      { fromUser: fromUserId, toUser: toUserId },
      { fromUser: toUserId, toUser: fromUserId },
    ],
  });

  if (existing?.status === 'accepted') {
    throw new AppError('You are already friends', 409, 'ALREADY_FRIENDS');
  }

  if (existing?.status === 'pending') {
    if (existing.fromUser.toString() === fromUserId.toString()) {
      throw new AppError('Friend request already sent', 409, 'REQUEST_EXISTS');
    }

    existing.status = 'accepted';
    await existing.save();

    const sender = await User.findById(fromUserId).select('name avatarUrl targetExam').lean();

    await createNotification(toUserId, {
      type: 'friend_accepted',
      title: 'Friend request accepted',
      body: `${sender?.name ?? 'A student'} accepted your friend request.`,
      data: { friendUserId: fromUserId.toString() },
    });

    const accepter = formatFriendUser(await User.findById(toUserId).select('name avatarUrl targetExam').lean());
    emitFriendRequestAccepted(fromUserId, { friend: accepter });
    emitFriendRequestAccepted(toUserId, { friend: formatFriendUser(sender) });

    return existing;
  }

  const request = await FriendRequest.create({
    fromUser: fromUserId,
    toUser: toUserId,
    status: 'pending',
  });

  const sender = await User.findById(fromUserId).select('name avatarUrl targetExam').lean();

  await createNotification(toUserId, {
    type: 'friend_request',
    title: 'New friend request',
    body: `${sender?.name ?? 'A student'} wants to connect with you.`,
    data: { requestId: request._id.toString(), fromUserId: fromUserId.toString() },
  });

  emitFriendRequestNew(toUserId, {
    id: request._id.toString(),
    fromUser: formatFriendUser(sender),
    createdAt: request.createdAt,
  });

  return request;
}

export async function listFriendRequests(userId, query) {
  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    FriendRequest.find({ toUser: userId, status: 'pending' })
      .populate('fromUser', 'name avatarUrl targetExam')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    FriendRequest.countDocuments({ toUser: userId, status: 'pending' }),
  ]);

  return buildPaginatedResult({
    items: items.map((item) => ({
      id: item._id.toString(),
      fromUser: formatFriendUser(item.fromUser),
      createdAt: item.createdAt,
    })),
    total,
    limit,
    offset,
  });
}

export async function respondFriendRequest(userId, requestId, action) {
  const request = await FriendRequest.findOne({ _id: requestId, toUser: userId, status: 'pending' });

  if (!request) {
    throw new AppError('Friend request not found', 404, 'NOT_FOUND');
  }

  request.status = action === 'accept' ? 'accepted' : 'rejected';
  await request.save();

  if (action === 'accept') {
    const responder = await User.findById(userId).select('name avatarUrl targetExam').lean();
    const requester = await User.findById(request.fromUser).select('name avatarUrl targetExam').lean();

    await createNotification(request.fromUser, {
      type: 'friend_accepted',
      title: 'Friend request accepted',
      body: `${responder?.name ?? 'A student'} accepted your friend request.`,
      data: { friendUserId: userId.toString() },
    });

    emitFriendRequestAccepted(request.fromUser, { friend: formatFriendUser(responder) });
    emitFriendRequestAccepted(userId, { friend: formatFriendUser(requester) });
  }

  return request;
}

export async function listFriends(userId, query) {
  const { limit, offset } = parsePagination(query);

  const friendships = await FriendRequest.find({
    status: 'accepted',
    $or: [{ fromUser: userId }, { toUser: userId }],
  })
    .populate('fromUser', 'name avatarUrl targetExam')
    .populate('toUser', 'name avatarUrl targetExam')
    .sort({ updatedAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  const total = await FriendRequest.countDocuments({
    status: 'accepted',
    $or: [{ fromUser: userId }, { toUser: userId }],
  });

  const items = friendships
    .map((friendship) => {
      const friend =
        friendship.fromUser._id.toString() === userId.toString()
          ? friendship.toUser
          : friendship.fromUser;
      return formatFriendUser(friend);
    })
    .filter(Boolean);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function removeFriend(userId, friendUserId) {
  const friendship = await FriendRequest.findOne({
    status: 'accepted',
    $or: [
      { fromUser: userId, toUser: friendUserId },
      { fromUser: friendUserId, toUser: userId },
    ],
  });

  if (!friendship) {
    throw new AppError('Friend not found', 404, 'NOT_FOUND');
  }

  await friendship.deleteOne();
  return { removed: true };
}

export { sortParticipantIds };
