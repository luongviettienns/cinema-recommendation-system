import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Electronic Ticket & Staff Check-in API (/api/v1/tickets)', () => {
  let customerToken = '';
  let staffToken = '';
  let testShowtimeId = '';
  let testSeatId = '';
  let createdBookingId = '';
  let createdTicketCode = '';
  let validQrCodeString = '';
  const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'cinelight-payment-secret-key-2026';

  beforeAll(async () => {
    // 1. Login customer & staff
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = custRes.body.data.accessToken;

    const staffRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@cinema.vn', password: '123456' });
    staffToken = staffRes.body.data.accessToken;

    // 2. Find showtime & seat
    const showtime = await prisma.showtime.findFirst({
      include: {
        room: {
          include: {
            seats: {
              take: 1,
              orderBy: [{ row: 'asc' }, { col: 'desc' }],
            },
          },
        },
      },
    });

    testShowtimeId = showtime!.id;
    testSeatId = showtime!.room.seats[0].id;

    // Clean up seat
    await prisma.bookingSeat.deleteMany({ where: { showtimeId: testShowtimeId, seatId: testSeatId } });

    // 3. Hold seat
    const holdRes = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        showtimeId: testShowtimeId,
        seatIds: [testSeatId],
      });

    createdBookingId = holdRes.body.data.bookingId;
    const bookingCode = holdRes.body.data.bookingCode;
    const amount = holdRes.body.data.totalAmount;

    // 4. Pay for booking via webhook to generate valid ticket
    const transactionId = `TXN-CHECKIN-${Date.now()}`;
    const rawData = `${bookingCode}|${transactionId}|${amount}`;
    const signature = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawData)
      .digest('hex');

    const payRes = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        bookingCode,
        transactionId,
        amount,
        paymentMethod: 'VIETQR',
        signature,
      });

    createdTicketCode = payRes.body.data.ticket.ticketCode;
    validQrCodeString = payRes.body.data.ticket.qrCode;
  });

  afterAll(async () => {
    if (createdBookingId) {
      await prisma.ticket.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.payment.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.bookingSeat.deleteMany({ where: { bookingId: createdBookingId } });
      await prisma.booking.deleteMany({ where: { id: createdBookingId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/v1/tickets/my-tickets - should return customer list of issued tickets', async () => {
    const res = await request(app)
      .get('/api/v1/tickets/my-tickets')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((t: any) => t.ticketCode === createdTicketCode);
    expect(found).toBeDefined();
  });

  it('GET /api/v1/tickets/:ticketCode - should return ticket details by code', async () => {
    const res = await request(app)
      .get(`/api/v1/tickets/${createdTicketCode}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketCode).toBe(createdTicketCode);
    expect(res.body.data.isUsed).toBe(false);
  });

  it('POST /api/v1/tickets/checkin - should reject regular customers from scanning tickets (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/tickets/checkin')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ qrCode: validQrCodeString });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/tickets/checkin - should reject tampered QR code (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/tickets/checkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ qrCode: 'fakePayload.tamperedSignature123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_QR_CODE');
  });

  it('POST /api/v1/tickets/checkin - should successfully check-in valid ticket as Staff', async () => {
    const res = await request(app)
      .post('/api/v1/tickets/checkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ qrCode: validQrCodeString });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketCode).toBe(createdTicketCode);
    expect(res.body.data.isUsed).toBe(true);
    expect(res.body.data.scannedAt).toBeDefined();
    expect(res.body.data.scannedByStaff).toBeDefined();
  });

  it('POST /api/v1/tickets/checkin - should reject double scanning the same ticket (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/tickets/checkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ qrCode: validQrCodeString });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TICKET_ALREADY_USED');
  });
});
