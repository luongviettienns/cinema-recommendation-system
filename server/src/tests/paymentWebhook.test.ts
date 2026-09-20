import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Payment & Webhook Signature API (/api/v1/payments)', () => {
  let customerToken = '';
  let showtimeId = '';
  let seatId = '';
  let bookingId = '';
  let bookingCode = '';
  let bookingAmount = 0;
  const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'cinelight-payment-secret-key-2026';

  beforeAll(async () => {
    // 1. Login customer
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = loginRes.body.data.accessToken;

    // 2. Find showtime & an available seat
    const showtime = await prisma.showtime.findFirst({
      include: {
        room: {
          include: {
            seats: {
              take: 1,
              orderBy: [{ row: 'desc' }, { col: 'desc' }], // pick seat in the back
            },
          },
        },
      },
    });

    showtimeId = showtime!.id;
    seatId = showtime!.room.seats[0].id;

    // Clean up any existing bookings on this seat
    await prisma.bookingSeat.deleteMany({ where: { showtimeId, seatId } });

    // 3. Create a holding booking
    const holdRes = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        showtimeId,
        seatIds: [seatId],
      });

    bookingId = holdRes.body.data.bookingId;
    bookingCode = holdRes.body.data.bookingCode;
    bookingAmount = holdRes.body.data.totalAmount;
  });

  afterAll(async () => {
    if (bookingId) {
      await prisma.ticket.deleteMany({ where: { bookingId } });
      await prisma.payment.deleteMany({ where: { bookingId } });
      await prisma.bookingSeat.deleteMany({ where: { bookingId } });
      await prisma.booking.deleteMany({ where: { id: bookingId } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/v1/payments/create-intent - should generate payment intent with VietQR / VNPay sandbox data', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId,
        paymentMethod: 'VIETQR',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentId).toBeDefined();
    expect(res.body.data.amount).toBe(bookingAmount);
    expect(res.body.data.paymentMethod).toBe('VIETQR');
    expect(res.body.data.qrCodeUrl).toBeDefined();
    expect(res.body.data.transferContent).toBe(bookingCode);
  });

  it('POST /api/v1/payments/webhook - should reject tampered webhook signature (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        bookingCode,
        transactionId: 'TXN-FAKE-12345',
        amount: bookingAmount,
        paymentMethod: 'VIETQR',
        signature: 'invalid-tampered-signature-xyz',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('POST /api/v1/payments/webhook - should reject when amount does not match booking totalAmount (400 Bad Request)', async () => {
    const transactionId = `TXN-FAKE-AMOUNT-${Date.now()}`;
    const forgedAmount = 1000; // 1000 VND instead of real amount
    const rawSignatureData = `${bookingCode}|${transactionId}|${forgedAmount}`;
    const validSignature = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawSignatureData)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        bookingCode,
        transactionId,
        amount: forgedAmount,
        paymentMethod: 'VIETQR',
        signature: validSignature,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PAYMENT_AMOUNT_MISMATCH');
  });

  it('POST /api/v1/payments/webhook - should verify HMAC-SHA512 signature, mark booking PAID, and issue Ticket', async () => {
    const transactionId = `TXN-REAL-${Date.now()}`;
    // Construct signature string: bookingCode|transactionId|amount
    const rawSignatureData = `${bookingCode}|${transactionId}|${bookingAmount}`;
    const validSignature = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawSignatureData)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        bookingCode,
        transactionId,
        amount: bookingAmount,
        paymentMethod: 'VIETQR',
        signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingStatus).toBe('PAID');
    expect(res.body.data.ticket).toBeDefined();
    expect(res.body.data.ticket.ticketCode).toBeDefined();
    expect(res.body.data.ticket.qrCode).toBeDefined();
  });

  it('POST /api/v1/payments/webhook - should be idempotent when receiving the same webhook again', async () => {
    const transactionId = `TXN-REAL-${Date.now()}`;
    const rawSignatureData = `${bookingCode}|${transactionId}|${bookingAmount}`;
    const validSignature = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawSignatureData)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        bookingCode,
        transactionId,
        amount: bookingAmount,
        paymentMethod: 'VIETQR',
        signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alreadyProcessed).toBe(true);
  });

  it('GET /api/v1/payments/:bookingId/status - should return SUCCESS payment and PAID booking', async () => {
    const res = await request(app)
      .get(`/api/v1/payments/${bookingId}/status`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentStatus).toBe('SUCCESS');
    expect(res.body.data.bookingStatus).toBe('PAID');
    expect(res.body.data.ticket).toBeDefined();
  });

  it('POST /api/v1/payments/webhook - should reject payment for CANCELLED booking (400 Bad Request)', async () => {
    // Create a dummy cancelled booking
    const cancelledBooking = await prisma.booking.create({
      data: {
        bookingCode: `CAN-${Date.now()}`,
        userId: (await prisma.user.findFirst({ where: { email: 'demo@cinema.vn' } }))!.id,
        showtimeId,
        status: 'CANCELLED',
        totalAmount: 100000,
        expiresAt: new Date(Date.now() - 60000),
      },
    });

    const transactionId = `TXN-CANCEL-${Date.now()}`;
    const rawSignatureData = `${cancelledBooking.bookingCode}|${transactionId}|100000`;
    const validSignature = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawSignatureData)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        bookingCode: cancelledBooking.bookingCode,
        transactionId,
        amount: 100000,
        paymentMethod: 'VIETQR',
        signature: validSignature,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BOOKING_ALREADY_CANCELLED');

    // Clean up
    await prisma.booking.delete({ where: { id: cancelledBooking.id } });
  });
});
