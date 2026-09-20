import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import dayjs from 'dayjs';
import { app } from '../app';
import { prisma } from '../prisma';
import { BookingStatus, PaymentMethod, PaymentStatus, RefundStatus, Role } from '@prisma/client';

describe('Refund Approval API (/api/v1/refunds & /api/v1/admin/refunds)', () => {
  let customerToken = '';
  let customerId = '';
  let adminToken = '';
  let adminId = '';

  let futureShowtimeId = '';
  let imminentShowtimeId = '';
  let testSeats: string[] = [];

  let testBooking1Id = '';
  let testRefund1Id = '';

  beforeAll(async () => {
    // 1. Authenticate customer & admin
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    customerToken = custRes.body.data.accessToken;
    customerId = custRes.body.data.user.id;

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cinema.vn', password: '123456' });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    // 2. Prepare showtimes
    const movie = await prisma.movie.findFirst();
    const room = await prisma.room.findFirst({
      include: {
        seats: { take: 10, orderBy: [{ row: 'asc' }, { col: 'asc' }] },
      },
    });

    expect(movie).toBeDefined();
    expect(room).toBeDefined();
    testSeats = room!.seats.map((s) => s.id);

    // Create future showtime (+24h)
    const futureStartTime = dayjs().add(24, 'hour').toDate();
    const futureEndTime = dayjs(futureStartTime).add(120, 'minute').toDate();
    const futureShowtime = await prisma.showtime.create({
      data: {
        movieId: movie!.id,
        roomId: room!.id,
        startTime: futureStartTime,
        endTime: futureEndTime,
        basePrice: 100000,
      },
    });
    futureShowtimeId = futureShowtime.id;

    // Create imminent showtime (+30m, < 60m)
    const imminentStartTime = dayjs().add(30, 'minute').toDate();
    const imminentEndTime = dayjs(imminentStartTime).add(120, 'minute').toDate();
    const imminentShowtime = await prisma.showtime.create({
      data: {
        movieId: movie!.id,
        roomId: room!.id,
        startTime: imminentStartTime,
        endTime: imminentEndTime,
        basePrice: 100000,
      },
    });
    imminentShowtimeId = imminentShowtime.id;
  });

  afterAll(async () => {
    // Clean up created test showtimes & cascade
    if (futureShowtimeId) {
      await prisma.showtime.deleteMany({ where: { id: futureShowtimeId } });
    }
    if (imminentShowtimeId) {
      await prisma.showtime.deleteMany({ where: { id: imminentShowtimeId } });
    }
  });

  // Helper to create a paid booking with ticket & payment
  const createPaidBooking = async (
    userId: string,
    showtimeId: string,
    seatId: string,
    isUsed = false,
  ) => {
    const booking = await prisma.booking.create({
      data: {
        bookingCode: `CL-${Math.floor(100000 + Math.random() * 900000)}`,
        userId,
        showtimeId,
        status: BookingStatus.PAID,
        totalAmount: 100000,
        expiresAt: new Date(Date.now() + 7 * 60 * 1000),
        bookingSeats: {
          create: [{ seatId, showtimeId, price: 100000 }],
        },
        payment: {
          create: {
            amount: 100000,
            paymentMethod: PaymentMethod.VIETQR,
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
          },
        },
        ticket: {
          create: {
            ticketCode: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
            qrCode: `HMAC_QR_${Math.random()}`,
            isUsed,
            scannedAt: isUsed ? new Date() : null,
          },
        },
      },
      include: { bookingSeats: true, ticket: true, payment: true },
    });
    return booking;
  };

  it('1. Gửi yêu cầu hoàn vé hợp lệ -> trả 201 Created và chuyển status sang REFUND_PENDING', async () => {
    const booking = await createPaidBooking(customerId, futureShowtimeId, testSeats[0]);
    testBooking1Id = booking.id;

    const res = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        reason: 'Tôi có lịch công tác đột xuất vào tối nay, xin rạp hỗ trợ hoàn vé.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.bookingId).toBe(booking.id);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.refundAmount).toBe(100000);

    testRefund1Id = res.body.data.id;

    // Check DB status
    const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking?.status).toBe(BookingStatus.REFUND_PENDING);
  });

  it('2. Từ chối yêu cầu hủy vé khi suất chiếu còn < 60 phút (REFUND_TIME_LIMIT_EXCEEDED)', async () => {
    const booking = await createPaidBooking(customerId, imminentShowtimeId, testSeats[1]);

    const res = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        reason: 'Tôi muốn hủy vé sát giờ chiếu',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('REFUND_TIME_LIMIT_EXCEEDED');
  });

  it('3. Từ chối yêu cầu hủy vé khi vé đã bị soát vào cổng (TICKET_ALREADY_USED)', async () => {
    const booking = await createPaidBooking(customerId, futureShowtimeId, testSeats[2], true);

    const res = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        reason: 'Vé đã quét rồi nhưng muốn hoàn',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TICKET_ALREADY_USED');
  });

  it('4. Chặn gửi trùng lặp yêu cầu hủy vé khi đang PENDING (REFUND_ALREADY_REQUESTED)', async () => {
    // testBooking1Id is already in PENDING state
    const res = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: testBooking1Id,
        reason: 'Gửi lại yêu cầu lần thứ 2',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('REFUND_ALREADY_REQUESTED');
  });

  it('5. User thường gọi API admin duyệt hoàn tiền bị chặn 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/refunds/${testRefund1Id}/process`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('6. Admin APPROVE -> Booking CANCELLED, Payment REFUNDED, BookingSeat bị xóa giải phóng ghế', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/refunds/${testRefund1Id}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'APPROVE',
        adminNote: 'Đã hoàn tiền vào tài khoản VietQR',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // DB assertions
    const refund = await prisma.refundRequest.findUnique({ where: { id: testRefund1Id } });
    expect(refund?.status).toBe(RefundStatus.APPROVED);
    expect(refund?.processedById).toBe(adminId);

    const booking = await prisma.booking.findUnique({
      where: { id: testBooking1Id },
      include: { bookingSeats: true, payment: true },
    });
    expect(booking?.status).toBe(BookingStatus.CANCELLED);
    expect(booking?.payment?.status).toBe(PaymentStatus.REFUNDED);
    expect(booking?.bookingSeats.length).toBe(0); // Seats freed!
  });

  it('7. Admin REJECT -> bắt buộc adminNote >= 5 ký tự; khi hợp lệ khôi phục Booking sang PAID và giữ nguyên BookingSeat', async () => {
    const booking = await createPaidBooking(customerId, futureShowtimeId, testSeats[3]);

    // Step a: Submit refund request
    const reqRes = await request(app)
      .post('/api/v1/refunds/request')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        reason: 'Muốn hủy vé xem phim này',
      });
    expect(reqRes.status).toBe(201);
    const refundId = reqRes.body.data.id;

    // Step b: Reject without adminNote -> 400
    const failRes = await request(app)
      .patch(`/api/v1/admin/refunds/${refundId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'REJECT' });
    expect(failRes.status).toBe(400);

    // Step c: Reject with valid adminNote
    const okRes = await request(app)
      .patch(`/api/v1/admin/refunds/${refundId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'REJECT',
        adminNote: 'Suất chiếu sắp diễn ra, rạp không thể xử lý hoàn vé.',
      });
    expect(okRes.status).toBe(200);

    // Step d: Verify DB state
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundId } });
    expect(refund?.status).toBe(RefundStatus.REJECTED);
    expect(refund?.adminNote).toBe('Suất chiếu sắp diễn ra, rạp không thể xử lý hoàn vé.');

    const restoredBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { bookingSeats: true },
    });
    expect(restoredBooking?.status).toBe(BookingStatus.PAID);
    expect(restoredBooking?.bookingSeats.length).toBe(1); // Seats preserved!
  });

  it('8. Admin direct-cancel -> hủy và hoàn tiền khẩn cấp ngay lập tức, không qua bước PENDING trung gian', async () => {
    const booking = await createPaidBooking(customerId, futureShowtimeId, testSeats[4]);

    const res = await request(app)
      .post('/api/v1/admin/refunds/direct-cancel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId: booking.id,
        reason: 'Phòng chiếu gặp sự cố kỹ thuật điều hòa/máy chiếu',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify DB state
    const cancelledBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { bookingSeats: true, payment: true, refundRequest: true },
    });

    expect(cancelledBooking?.status).toBe(BookingStatus.CANCELLED);
    expect(cancelledBooking?.payment?.status).toBe(PaymentStatus.REFUNDED);
    expect(cancelledBooking?.bookingSeats.length).toBe(0); // Freed
    expect(cancelledBooking?.refundRequest?.status).toBe(RefundStatus.APPROVED);
  });

  it('9. GET /api/v1/refunds/my-requests trả danh sách yêu cầu của chính khách hàng', async () => {
    const res = await request(app)
      .get('/api/v1/refunds/my-requests')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].bookingCode).toBeDefined();
    expect(res.body.data[0].movieTitle).toBeDefined();
  });

  it('10. GET /api/v1/admin/refunds hỗ trợ lọc status và phân trang', async () => {
    const res = await request(app)
      .get('/api/v1/admin/refunds?status=ALL&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
  });
});
