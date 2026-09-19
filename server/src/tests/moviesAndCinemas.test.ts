import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Movies & Cinemas API Endpoints', () => {
  let adminToken = '';
  let customerToken = '';
  let testMovieId = '';
  let sampleRoomId = '';

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cinema.vn', password: '123456' });
    adminToken = adminLogin.body.data.accessToken;

    // Login as customer
    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = customerLogin.body.data.accessToken;

    // Get a room id
    const room = await prisma.room.findFirst();
    if (room) sampleRoomId = room.id;
  });

  afterAll(async () => {
    if (testMovieId) {
      await prisma.movie.deleteMany({ where: { id: testMovieId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/v1/movies - should return list of movies with genres', async () => {
    const res = await request(app).get('/api/v1/movies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].movieGenres).toBeDefined();
  });

  it('GET /api/v1/movies?isNowShowing=true - should filter now showing movies', async () => {
    const res = await request(app).get('/api/v1/movies?isNowShowing=true');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((m: any) => {
      expect(m.isNowShowing).toBe(true);
    });
  });

  it('POST /api/v1/movies - should reject unauthorized customer with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/movies')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'Phim Thử Nghiệm Bị Chặn',
        description: 'Mô tả',
        duration: 120,
        releaseDate: '2026-09-01',
        poster: 'https://example.com/poster.jpg',
        backdrop: 'https://example.com/backdrop.jpg',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/movies - should allow Admin to create a new movie', async () => {
    const res = await request(app)
      .post('/api/v1/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Phim Mới Tạo Bởi Admin ' + Date.now(),
        description: 'Mô tả phim hành động kịch tính',
        duration: 135,
        releaseDate: '2026-09-25',
        poster: 'https://example.com/poster.jpg',
        backdrop: 'https://example.com/backdrop.jpg',
        rating: 8.5,
        director: 'Đạo diễn Christopher',
        isHot: true,
        isNowShowing: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testMovieId = res.body.data.id;
  });

  it('GET /api/v1/cinemas - should return 3 cinemas with rooms', async () => {
    const res = await request(app).get('/api/v1/cinemas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data[0].rooms).toBeDefined();
  });

  it('GET /api/v1/cinemas/rooms/:roomId/seats - should return 80 seats matrix', async () => {
    const res = await request(app).get(`/api/v1/cinemas/rooms/${sampleRoomId}/seats`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.seats).toHaveLength(80);
    expect(res.body.data.seats[0].seatNumber).toBe('A1');
  });
});
