import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Auth Refresh Token API (/api/v1/auth/refresh-token)', () => {
  let validRefreshToken = '';
  let customerEmail = 'demo@cinema.vn';

  beforeAll(async () => {
    // 1. Login to obtain valid tokens
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: customerEmail, password: '123456' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.refreshToken).toBeDefined();
    validRefreshToken = loginRes.body.data.refreshToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/auth/refresh-token - should issue a new pair of access and refresh tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(customerEmail);
  });

  it('POST /api/v1/auth/refresh-token - should reject empty refresh token (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('REFRESH_TOKEN_REQUIRED');
  });

  it('POST /api/v1/auth/refresh-token - should reject invalid/forged refresh token (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: 'invalid.forged.jwt.token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
