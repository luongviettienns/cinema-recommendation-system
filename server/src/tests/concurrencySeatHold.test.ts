import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Seat Hold & Concurrency Control (/api/v1/bookings)', () => {
  let customer1Token = '';
  let customer2Token = '';
  let showtimeId = '';
  let availableSeatIds: string[] = [];
  let heldBookingId = '';

  beforeAll(async () => {
    // 1. Authenticate customer 1 (demo@cinema.vn)
    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customer1Token = res1.body.data.accessToken;

    // 2. Register/Authenticate customer 2 for concurrency contest
    const cust2Email = `contest_user_${Date.now()}@cinema.vn`;
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: cust2Email,
        password: 'password123',
        name: 'Người Tranh Chấp Ghế',
        phone: '0901234567',
      });
    customer2Token = res2.body.data.accessToken;

    // 3. Find an active showtime with available seats
    const showtime = await prisma.showtime.findFirst({
      include: {
        room: {
          include: {
            seats: {
              take: 5,
              orderBy: [{ row: 'asc' }, { col: 'asc' }],
            },
          },
        },
      },
    });

    showtimeId = showtime!.id;
    availableSeatIds = showtime!.room.seats.map((s) => s.id);

    // Clean up any lingering bookings from previous test runs
    await prisma.bookingSeat.deleteMany({ where: { showtimeId } });
    await prisma.booking.deleteMany({ where: { showtimeId } });
  });

  afterAll(async () => {
    // Clean up created bookings
    if (showtimeId) {
      await prisma.bookingSeat.deleteMany({ where: { showtimeId } });
      await prisma.booking.deleteMany({ where: { showtimeId } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/v1/bookings/hold - should successfully hold 2 seats for 7 minutes (420 seconds)', async () => {
    const seatsToHold = [availableSeatIds[0], availableSeatIds[1]];

    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        showtimeId,
        seatIds: seatsToHold,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toBeDefined();
    expect(res.body.data.status).toBe('HOLDING');
    expect(res.body.data.holdingSecondsRemaining).toBeGreaterThanOrEqual(415);
    expect(res.body.data.holdingSecondsRemaining).toBeLessThanOrEqual(420);
    expect(res.body.data.seats.length).toBe(2);

    heldBookingId = res.body.data.bookingId;
  });

  it('POST /api/v1/bookings/hold - should reject holding already held seats (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        showtimeId,
        seatIds: [availableSeatIds[0]], // same seat as customer 1
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SEAT_ALREADY_HOLDING_OR_BOOKED');
  });

  it('CONCURRENCY TEST - 2 simultaneous requests for the exact same seat: exactly 1 must win (201) and 1 must fail (409)', async () => {
    const contestedSeatId = availableSeatIds[2];

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          showtimeId,
          seatIds: [contestedSeatId],
        }),
      request(app)
        .post('/api/v1/bookings/hold')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          showtimeId,
          seatIds: [contestedSeatId],
        }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 201 Created, and one 409 Conflict
    expect(statuses).toEqual([201, 409]);

    // Clean up whichever booking won
    const winningRes = res1.status === 201 ? res1 : res2;
    if (winningRes.body.data?.bookingId) {
      await prisma.bookingSeat.deleteMany({ where: { bookingId: winningRes.body.data.bookingId } });
      await prisma.booking.deleteMany({ where: { id: winningRes.body.data.bookingId } });
    }
  });

  it('POST /api/v1/bookings/:id/release - should release held booking making seats available again', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${heldBookingId}/release`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify seat can now be held by customer 2 immediately
    const holdAgainRes = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        showtimeId,
        seatIds: [availableSeatIds[0]],
      });

    expect(holdAgainRes.status).toBe(201);
    expect(holdAgainRes.body.success).toBe(true);

    // Clean up
    await prisma.bookingSeat.deleteMany({ where: { bookingId: holdAgainRes.body.data.bookingId } });
    await prisma.booking.deleteMany({ where: { id: holdAgainRes.body.data.bookingId } });
    heldBookingId = '';
  });

  it('GET /api/v1/bookings/my-bookings - should return list of bookings for the logged-in customer', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
