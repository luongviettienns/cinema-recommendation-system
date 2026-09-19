import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Showtime API Endpoints (/api/v1/showtimes)', () => {
  let adminToken = '';
  let customerToken = '';
  let testMovieId = '';
  let testRoomId = '';
  let createdShowtimeId = '';

  beforeAll(async () => {
    // Login admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cinema.vn', password: '123456' });
    adminToken = adminRes.body.data.accessToken;

    // Login customer
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = custRes.body.data.accessToken;

    // Find movie and room for testing
    const movie = await prisma.movie.findFirst();
    testMovieId = movie!.id;

    const room = await prisma.room.findFirst();
    testRoomId = room!.id;
  });

  afterAll(async () => {
    if (createdShowtimeId) {
      await prisma.showtime.deleteMany({
        where: { id: createdShowtimeId },
      });
    }
    await prisma.$disconnect();
  });

  it('GET /api/v1/showtimes - should return list of showtimes', async () => {
    const res = await request(app).get('/api/v1/showtimes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/showtimes - should reject non-admin users (403 Forbidden)', async () => {
    const startTime = new Date(Date.now() + 24 * 3600 * 1000); // tomorrow
    const res = await request(app)
      .post('/api/v1/showtimes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        movieId: testMovieId,
        roomId: testRoomId,
        startTime: startTime.toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/showtimes - should successfully schedule a new showtime as Admin', async () => {
    // Seeded data occupies 19:30 on the next three calendar days. Keep this
    // fixture beyond that fixed seed window so it can exercise creation first.
    const startTime = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    startTime.setMinutes(0, 0, 0);

    const res = await request(app)
      .post('/api/v1/showtimes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: testMovieId,
        roomId: testRoomId,
        startTime: startTime.toISOString(),
        format: 'TWO_D',
        language: 'Phụ đề Tiếng Việt',
        basePrice: 95000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.roomId).toBe(testRoomId);
    expect(res.body.data.movieId).toBe(testMovieId);
    // End time should be automatically calculated: startTime + movie.duration + 15 min cleaning
    expect(new Date(res.body.data.endTime).getTime()).toBeGreaterThan(new Date(res.body.data.startTime).getTime());
    createdShowtimeId = res.body.data.id;
  });

  it('POST /api/v1/showtimes - should reject overlapping showtime in the same room (409 Conflict)', async () => {
    // Attempt to schedule a showtime 30 minutes after createdShowtimeId starts (which overlaps)
    const existing = await prisma.showtime.findUnique({ where: { id: createdShowtimeId } });
    expect(existing).toBeDefined();

    const overlappingStartTime = new Date(existing!.startTime.getTime() + 30 * 60 * 1000);

    const res = await request(app)
      .post('/api/v1/showtimes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: testMovieId,
        roomId: testRoomId,
        startTime: overlappingStartTime.toISOString(),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SHOWTIME_OVERLAP');
  });

  it('GET /api/v1/showtimes/:id - should get showtime details with room & seats availability', async () => {
    const res = await request(app).get(`/api/v1/showtimes/${createdShowtimeId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdShowtimeId);
    expect(res.body.data.room).toBeDefined();
    expect(res.body.data.movie).toBeDefined();
    expect(Array.isArray(res.body.data.seats)).toBe(true);
  });

  it('DELETE /api/v1/showtimes/:id - should delete showtime with no bookings as Admin', async () => {
    const res = await request(app)
      .delete(`/api/v1/showtimes/${createdShowtimeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    createdShowtimeId = ''; // Cleared so afterAll doesn't try to delete again
  });
});
