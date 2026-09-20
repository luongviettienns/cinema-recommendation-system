import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Admin Analytics & Management API (/api/v1/admin)', () => {
  let adminToken = '';
  let customerToken = '';
  let adminId = '';
  let testCinemaId = '';
  const testUserIds: string[] = [];

  const createTestUser = async (role: 'CUSTOMER' | 'STAFF' = 'CUSTOMER') => {
    const user = await prisma.user.create({
      data: {
        email: `temp_admin_test_${crypto.randomUUID()}@cinema.vn`,
        password: 'hashedpassword',
        name: 'Legacy role test user',
        role,
        ...(role === 'STAFF' ? { assignedCinemaId: testCinemaId } : {}),
      },
    });
    testUserIds.push(user.id);
    return user;
  };

  beforeAll(async () => {
    // 1. Login admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cinema.vn', password: '123456' });
    adminToken = adminRes.body.data.accessToken;

    // 2. Login customer
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = custRes.body.data.accessToken;

    // 3. Create a temporary user for role update tests
    const tempUser = await prisma.user.create({
      data: {
        email: `temp_admin_test_${Date.now()}@cinema.vn`,
        password: 'hashedpassword',
        name: 'Người Dùng Kiểm Thử',
        role: 'CUSTOMER',
      },
    });
    testUserIds.push(tempUser.id);

    const [protectedAdmin, cinema] = await Promise.all([
      prisma.user.create({
        data: {
          email: `protected_admin_${crypto.randomUUID()}@cinema.vn`,
          password: 'hashedpassword',
          name: 'Protected Admin test target',
          role: 'ADMIN',
        },
      }),
      prisma.cinema.create({
        data: {
          name: `Legacy role cinema ${crypto.randomUUID()}`,
          address: 'Legacy role test address',
        },
      }),
    ]);
    adminId = protectedAdmin.id;
    testUserIds.push(protectedAdmin.id);
    testCinemaId = cinema.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    if (testCinemaId) await prisma.cinema.deleteMany({ where: { id: testCinemaId } });
    await prisma.$disconnect();
  });

  it('GET /api/v1/admin/dashboard - should reject unauthorized requests (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/dashboard - should reject non-admin users (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/dashboard - should return dashboard metrics for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview).toBeDefined();
    expect(res.body.data.overview.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(res.body.data.overview.totalTickets).toBeGreaterThanOrEqual(0);
    expect(res.body.data.overview.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.overview.totalMovies).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.topMovies)).toBe(true);
    expect(Array.isArray(res.body.data.revenueByDay)).toBe(true);
  });

  it('GET /api/v1/admin/recent-bookings - should return recent bookings list for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/recent-bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/admin/users - should return user management list for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/v1/admin/users/:id/role - rejects Staff promotion without a cinema', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STAFF' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('STAFF_CINEMA_REQUIRED');
    await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({
      role: 'CUSTOMER',
      assignedCinemaId: null,
    });
  });

  it('PATCH /api/v1/admin/users/:id/role - rejects Staff promotion with an unknown cinema', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STAFF', assignedCinemaId: crypto.randomUUID() });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CINEMA_NOT_FOUND');
    await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({
      role: 'CUSTOMER',
      assignedCinemaId: null,
    });
  });

  it('PATCH /api/v1/admin/users/:id/role - atomically promotes Staff with a real cinema', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STAFF', assignedCinemaId: testCinemaId });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: user.id,
      role: 'STAFF',
      assignedCinemaId: testCinemaId,
    });
    await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({
      role: 'STAFF',
      assignedCinemaId: testCinemaId,
    });
  });

  it('PATCH /api/v1/admin/users/:id/role - clears assignment when Staff is demoted', async () => {
    const user = await createTestUser('STAFF');
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'CUSTOMER' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: user.id,
      role: 'CUSTOMER',
      assignedCinemaId: null,
    });
    await expect(prisma.user.findUniqueOrThrow({ where: { id: user.id } })).resolves.toMatchObject({
      role: 'CUSTOMER',
      assignedCinemaId: null,
    });
  });

  it('PATCH /api/v1/admin/users/:id/role - protects every Admin target', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${adminId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'CUSTOMER' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ADMIN_ACCOUNT_PROTECTED');
  });
});
