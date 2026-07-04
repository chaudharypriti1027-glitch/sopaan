import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { TeamInvite } from '../src/models/TeamInvite.js';
import { User } from '../src/models/User.js';
import { getSeedAdminUser } from '../src/seed/adminConfig.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginAs(user) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password ?? 'Password123!' })
    .expect(200);

  return res.body.token;
}

describe('admin team and role access', () => {
  let admin;
  let adminToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const seed = getSeedAdminUser();
    admin = await createTestUser({
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      role: 'admin',
      password: seed.password,
    });

    adminToken = await loginAs({ ...admin.toObject(), password: seed.password });
  });

  it('lists team members including owner flag', async () => {
    const creator = await createTestUser({
      email: 'creator@test.com',
      role: 'creator',
    });

    const res = await request(app)
      .get('/api/admin/team')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.ownerEmail).toBe(getSeedAdminUser().email);
    expect(res.body.items.some((row) => row.id === admin._id.toString() && row.isOwner)).toBe(true);
    expect(res.body.items.some((row) => row.id === creator._id.toString() && row.role === 'creator')).toBe(
      true,
    );
  });

  it('invites a new email and returns signup url', async () => {
    const res = await request(app)
      .post('/api/admin/team/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newcreator@test.com', role: 'creator' })
      .expect(201);

    expect(res.body.kind).toBe('invited');
    expect(res.body.signupUrl).toMatch(/invite\?token=/);

    const invite = await TeamInvite.findOne({ email: 'newcreator@test.com' }).lean();
    expect(invite?.role).toBe('creator');
    expect(invite?.status).toBe('pending');
  });

  it('upgrades an existing user immediately on invite', async () => {
    const student = await createTestUser({
      email: 'upgrade@test.com',
      role: 'student',
    });

    const res = await request(app)
      .post('/api/admin/team/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: student.email, role: 'moderator' })
      .expect(201);

    expect(res.body.kind).toBe('existing');
    expect(res.body.member.role).toBe('moderator');

    const updated = await User.findById(student._id).lean();
    expect(updated.role).toBe('moderator');
  });

  it('patches team member role and blocks owner changes', async () => {
    const creator = await createTestUser({
      email: 'patchme@test.com',
      role: 'creator',
    });

    await request(app)
      .patch(`/api/admin/team/${creator._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'moderator' })
      .expect(200);

    const updated = await User.findById(creator._id).lean();
    expect(updated.role).toBe('moderator');

    await request(app)
      .patch(`/api/admin/team/${admin._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'creator' })
      .expect(403);
  });

  it('removes team member by demoting to student', async () => {
    const moderator = await createTestUser({
      email: 'removeme@test.com',
      role: 'moderator',
    });

    await request(app)
      .delete(`/api/admin/team/${moderator._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const updated = await User.findById(moderator._id).lean();
    expect(updated.role).toBe('student');
  });

  it('creator can author content but not revenue or team management', async () => {
    const creator = await createTestUser({
      email: 'creator-access@test.com',
      role: 'creator',
    });
    const creatorToken = await loginAs(creator);

    await request(app)
      .get('/api/admin/questions')
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(200);

    await request(app)
      .get('/api/admin/revenue')
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(403);

    await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(403);

    await request(app)
      .post('/api/admin/team/invite')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ email: 'blocked@test.com', role: 'creator' })
      .expect(403);
  });

  it('role changes take effect immediately without re-login', async () => {
    const creator = await createTestUser({
      email: 'promote@test.com',
      role: 'creator',
    });
    const creatorToken = await loginAs(creator);

    await request(app)
      .get('/api/admin/revenue')
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(403);

    await request(app)
      .patch(`/api/admin/team/${creator._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
      .expect(200);

    await request(app)
      .get('/api/admin/revenue')
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(200);
  });

  it('signup with invite token assigns team role', async () => {
    const inviteRes = await request(app)
      .post('/api/admin/team/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'invited-signup@test.com', role: 'creator' })
      .expect(201);

    const token = new URL(inviteRes.body.signupUrl).searchParams.get('token');
    expect(token).toBeTruthy();

    const preview = await request(app).get(`/api/auth/team-invite/${token}`).expect(200);
    expect(preview.body.email).toBe('invited-signup@test.com');
    expect(preview.body.role).toBe('creator');

    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Invited Creator',
        email: 'invited-signup@test.com',
        password: 'Password123!',
        inviteToken: token,
        privacyConsent: {
          policyVersion: '1.0',
          aiProcessing: true,
          marketing: false,
        },
      })
      .expect(201);

    expect(signupRes.body.user.role).toBe('creator');

    const user = await User.findOne({ email: 'invited-signup@test.com' }).lean();
    expect(user.role).toBe('creator');
  });
});
