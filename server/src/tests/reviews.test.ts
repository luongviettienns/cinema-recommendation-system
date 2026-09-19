import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Movie Reviews API (/api/v1/movies/:id/reviews)', () => {
  let customerToken = '';
  let movieId = '';
  let createdReviewId = '';

  beforeAll(async () => {
    // 1. Login customer
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = loginRes.body.data.accessToken;

    // 2. Find a movie
    const movie = await prisma.movie.findFirst();
    movieId = movie!.id;
  });

  afterAll(async () => {
    if (createdReviewId) {
      await prisma.review.deleteMany({ where: { id: createdReviewId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/v1/movies/:id/reviews - should return reviews array for a movie', async () => {
    const res = await request(app).get(`/api/v1/movies/${movieId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/movies/:id/reviews - should create a new review and update movie average rating', async () => {
    const res = await request(app)
      .post(`/api/v1/movies/${movieId}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 9,
        comment: 'Phim cực kỳ mãn nhãn và xuất sắc, âm thanh đỉnh cao!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(9);
    expect(res.body.data.comment).toContain('mãn nhãn');
    expect(res.body.data.user).toBeDefined();

    createdReviewId = res.body.data.id;
  });

  it('POST /api/v1/movies/:id/reviews - should reject invalid rating (< 1 or > 10)', async () => {
    const res = await request(app)
      .post(`/api/v1/movies/${movieId}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 15,
        comment: 'Rating quá cao',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
