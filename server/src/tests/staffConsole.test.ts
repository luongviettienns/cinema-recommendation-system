import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Staff Console API (/api/v1/staff)', () => {
  let customerToken = '';
  let staffToken = '';
  let adminToken = '';
  let testShowtimeId = '';
  let testRoomId = '';
  let availableSeatIds: string[] = [];
  let soldTicketId = '';
  let soldTicketCode = '';
  let soldQrCode = '';

  beforeAll(async () => {
    // 1. Authenticate Customer, Staff, Admin
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = custRes.body.data.accessToken;

    const staffRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@cinema.vn', password: '123456' });
    staffToken = staffRes.body.data.accessToken;

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cinema.vn', password: '123456' });
    adminToken = adminRes.body.data.accessToken;

    // 2. Find a test showtime with room and seats
    const showtime = await prisma.showtime.findFirst({
      include: {
        room: {
          include: {
            seats: {
              take: 5,
              orderBy: [{ row: 'desc' }, { col: 'desc' }],
            },
          },
        },
      },
    });

    testShowtimeId = showtime!.id;
    testRoomId = showtime!.roomId;
    availableSeatIds = showtime!.room.seats.map((s) => s.id);

    // Clean up any existing bookings for these seats in this showtime
    await prisma.bookingSeat.deleteMany({
      where: {
        showtimeId: testShowtimeId,
        seatId: { in: availableSeatIds },
      },
    });
  });

  // TEST 1: Role-based Authorization Guard
  it('ROLE GUARD - should reject CUSTOMER token with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/staff/showtimes/today')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('ROLE GUARD - should allow STAFF token to access Staff Console', async () => {
    const res = await request(app)
      .get('/api/v1/staff/showtimes/today')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('ROLE GUARD - should allow ADMIN token to access Staff Console (Super-user support)', async () => {
    const res = await request(app)
      .get('/api/v1/staff/showtimes/today')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TEST 2: Walk-in Box Office Ticket Sale
  it('POST /api/v1/staff/box-office/sell - should sell ticket directly at counter (PAID immediately)', async () => {
    const seatToSell = availableSeatIds[0];
    const res = await request(app)
      .post('/api/v1/staff/box-office/sell')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        showtimeId: testShowtimeId,
        seatIds: [seatToSell],
        customerName: 'Khách Vãng Lai 01',
        customerPhone: '0988776655',
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.status).toBe('PAID');
    expect(res.body.data.tickets).toHaveLength(1);
    expect(res.body.data.tickets[0].qrCode).toBeDefined();

    soldTicketId = res.body.data.tickets[0].id;
    soldTicketCode = res.body.data.tickets[0].ticketCode;
    soldQrCode = res.body.data.tickets[0].qrCode;
  });

  // TEST 3: Seat-swap (In-theater incident resolution)
  it('POST /api/v1/staff/seats/swap - should swap broken seat to available seat immediately', async () => {
    const oldSeatId = availableSeatIds[0];
    const newSeatId = availableSeatIds[1];

    const res = await request(app)
      .post('/api/v1/staff/seats/swap')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        showtimeId: testShowtimeId,
        ticketId: soldTicketId,
        oldSeatId,
        newSeatId,
        reason: 'Ghế cũ bị gãy tựa lưng',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newSeat.id).toBe(newSeatId);
  });

  // TEST 4: QR Check-in & Double-scan prevention
  it('POST /api/v1/staff/tickets/scan - should check-in valid ticket (HTTP 200)', async () => {
    const res = await request(app)
      .post('/api/v1/staff/tickets/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        ticketCode: soldTicketCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.ticket.isUsed).toBe(true);
  });

  it('POST /api/v1/staff/tickets/scan - should REJECT double scanning the same ticket (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/staff/tickets/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        ticketCode: soldTicketCode,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TICKET_ALREADY_USED');
  });

  // TEST 5: Showtime Attendance Report
  it('GET /api/v1/staff/showtimes/:id/attendance - should return attendance breakdown for showtime', async () => {
    const res = await request(app)
      .get(`/api/v1/staff/showtimes/${testShowtimeId}/attendance`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.totalBooked).toBeGreaterThanOrEqual(1);
    expect(res.body.data.metrics.totalCheckedIn).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.attendees)).toBe(true);
  });
});
