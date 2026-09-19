import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Admin Analytics & Management API (/api/v1/admin)', () => {
  let adminToken = '';
  let customerToken = '';
  let testUserId = '';

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
    testUserId = tempUser.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
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

  it('PATCH /api/v1/admin/users/:id/role - should allow Admin to update user role', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STAFF' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('STAFF');
  });
});
