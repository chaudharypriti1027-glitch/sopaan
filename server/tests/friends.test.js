import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { FriendRequest } from '../src/models/FriendRequest.js';
import { User } from '../src/models/User.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

describe('friends and conversations API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('sends, accepts friend request and opens conversation', async () => {
    const studentA = await User.create({
      name: 'Asha',
      email: `asha_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    const studentB = await User.create({
      name: 'Brij',
      email: `brij_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    const sendResponse = await request(app)
      .post('/api/friends')
      .set(authHeader(studentA))
      .send({ userId: studentB._id.toString() });

    expect(sendResponse.status).toBe(201);

    const requestsResponse = await request(app)
      .get('/api/friends/requests')
      .set(authHeader(studentB));

    expect(requestsResponse.status).toBe(200);
    expect(requestsResponse.body.items).toHaveLength(1);

    const requestId = requestsResponse.body.items[0].id;

    const acceptResponse = await request(app)
      .post(`/api/friends/requests/${requestId}/respond`)
      .set(authHeader(studentB))
      .send({ action: 'accept' });

    expect(acceptResponse.status).toBe(200);

    const friendsResponse = await request(app)
      .get('/api/friends')
      .set(authHeader(studentA));

    expect(friendsResponse.status).toBe(200);
    expect(friendsResponse.body.items).toHaveLength(1);
    expect(friendsResponse.body.items[0].name).toBe('Brij');

    const conversationResponse = await request(app)
      .post('/api/conversations')
      .set(authHeader(studentA))
      .send({ friendUserId: studentB._id.toString() });

    expect(conversationResponse.status).toBe(200);
    expect(conversationResponse.body.friend.name).toBe('Brij');
    expect(conversationResponse.body.id).toEqual(expect.any(String));

    const friendship = await FriendRequest.findOne({ status: 'accepted' });
    expect(friendship).toBeTruthy();
  });

  it('blocks conversation when users are not friends', async () => {
    const studentA = await User.create({
      name: 'Chetan',
      email: `chetan_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    const studentB = await User.create({
      name: 'Divya',
      email: `divya_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    const response = await request(app)
      .post('/api/conversations')
      .set(authHeader(studentA))
      .send({ friendUserId: studentB._id.toString() });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('NOT_FRIENDS');
  });
});
