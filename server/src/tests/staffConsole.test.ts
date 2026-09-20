import bcrypt from 'bcrypt';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Staff Console API (/api/v1/staff)', () => {
  const identifier = crypto.randomUUID();
  let customerToken = '';
  let staffToken = '';
  let adminToken = '';
  let orphanStaffToken = '';
  let orphanStaffId = '';
  let assignedCinemaId = '';
  let testShowtimeId = '';
  let availableSeatIds: string[] = [];
  let soldBookingId = '';
  let soldTicketId = '';
  let soldTicketCode = '';
  let foreignCinemaId = '';
  let foreignShowtimeId = '';
  let foreignBookingId = '';
  let foreignBookingSeatId = '';
  let foreignTicketId = '';
  let foreignTicketCode = '';
  let foreignSeatIds: string[] = [];

  beforeAll(async () => {
    const [customerLogin, staffLogin, adminLogin, staffUser, customer, movie] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: 'demo@cinema.vn', password: '123456' }),
      request(app).post('/api/v1/auth/login').send({ email: 'staff@cinema.vn', password: '123456' }),
      request(app).post('/api/v1/auth/login').send({ email: 'admin@cinema.vn', password: '123456' }),
      prisma.user.findUniqueOrThrow({
        where: { email: 'staff@cinema.vn' },
        select: { assignedCinemaId: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { email: 'demo@cinema.vn' },
        select: { id: true },
      }),
      prisma.movie.findFirstOrThrow({ select: { id: true, duration: true } }),
    ]);

    customerToken = customerLogin.body.data.accessToken;
    staffToken = staffLogin.body.data.accessToken;
    adminToken = adminLogin.body.data.accessToken;
    assignedCinemaId = staffUser.assignedCinemaId!;

    const ownShowtime = await prisma.showtime.findFirstOrThrow({
      where: { room: { cinemaId: assignedCinemaId } },
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
    testShowtimeId = ownShowtime.id;
    availableSeatIds = ownShowtime.room.seats.map((seat) => seat.id);
    await prisma.bookingSeat.deleteMany({
      where: { showtimeId: testShowtimeId, seatId: { in: availableSeatIds } },
    });

    const foreignCinema = await prisma.cinema.create({
      data: {
        name: `Foreign cinema ${identifier}`,
        address: 'Foreign cinema test address',
      },
    });
    foreignCinemaId = foreignCinema.id;
    const foreignRoom = await prisma.room.create({
      data: {
        cinemaId: foreignCinemaId,
        name: 'Foreign room',
        totalSeats: 4,
      },
    });
    await prisma.seat.createMany({
      data: [1, 2, 3, 4].map((col) => ({
        roomId: foreignRoom.id,
        seatNumber: `F${col}`,
        row: 'F',
        col,
      })),
    });
    foreignSeatIds = (
      await prisma.seat.findMany({ where: { roomId: foreignRoom.id }, orderBy: { col: 'asc' } })
    ).map((seat) => seat.id);

    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 30);
    const foreignShowtime = await prisma.showtime.create({
      data: {
        movieId: movie.id,
        roomId: foreignRoom.id,
        startTime,
        endTime: new Date(startTime.getTime() + movie.duration * 60_000),
        basePrice: 90_000,
      },
    });
    foreignShowtimeId = foreignShowtime.id;

    const foreignBooking = await prisma.booking.create({
      data: {
        bookingCode: `FOREIGN-${identifier}`,
        userId: customer.id,
        showtimeId: foreignShowtimeId,
        status: 'PAID',
        totalAmount: 90_000,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    foreignBookingId = foreignBooking.id;
    const foreignBookingSeat = await prisma.bookingSeat.create({
      data: {
        bookingId: foreignBookingId,
        showtimeId: foreignShowtimeId,
        seatId: foreignSeatIds[0],
        price: 90_000,
      },
    });
    foreignBookingSeatId = foreignBookingSeat.id;
    const foreignTicket = await prisma.ticket.create({
      data: {
        bookingId: foreignBookingId,
        ticketCode: `FOREIGN-TICKET-${identifier}`,
        qrCode: `foreign-qr-${identifier}`,
      },
    });
    foreignTicketId = foreignTicket.id;
    foreignTicketCode = foreignTicket.ticketCode;

    const orphanPassword = await bcrypt.hash('123456', 4);
    const orphanStaff = await prisma.user.create({
      data: {
        email: `orphan-console-${identifier}@cinema.vn`,
        password: orphanPassword,
        name: 'Orphan console Staff',
        role: 'STAFF',
      },
    });
    orphanStaffId = orphanStaff.id;
    const orphanLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: orphanStaff.email, password: '123456' });
    orphanStaffToken = orphanLogin.body.data.accessToken;
  });

  afterAll(async () => {
    if (soldBookingId) await prisma.booking.deleteMany({ where: { id: soldBookingId } });
    if (foreignShowtimeId) await prisma.booking.deleteMany({ where: { showtimeId: foreignShowtimeId } });
    if (foreignShowtimeId) await prisma.showtime.deleteMany({ where: { id: foreignShowtimeId } });
    if (foreignCinemaId) await prisma.cinema.deleteMany({ where: { id: foreignCinemaId } });
    if (orphanStaffId) await prisma.user.deleteMany({ where: { id: orphanStaffId } });
  });

  it('rejects a CUSTOMER token with 403 Forbidden', async () => {
    const response = await request(app)
      .get('/api/v1/staff/showtimes/today')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('uses the Staff assignment for today showtimes instead of trusting cinemaId', async () => {
    const response = await request(app)
      .get('/api/v1/staff/showtimes/today')
      .query({ cinemaId: foreignCinemaId })
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((showtime: { cinema: { id: string } }) => showtime.cinema.id === assignedCinemaId)).toBe(true);
    expect(response.body.data.some((showtime: { id: string }) => showtime.id === foreignShowtimeId)).toBe(false);
  });

  it('fails safely when a Staff account has no cinema assignment', async () => {
    const response = await request(app)
      .get('/api/v1/staff/showtimes/today')
      .set('Authorization', `Bearer ${orphanStaffToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('STAFF_CINEMA_REQUIRED');
  });

  it('keeps ADMIN global Staff-console access', async () => {
    const [todayResponse, attendanceResponse] = await Promise.all([
      request(app)
        .get('/api/v1/staff/showtimes/today')
        .query({ cinemaId: foreignCinemaId })
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .get(`/api/v1/staff/showtimes/${foreignShowtimeId}/attendance`)
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    expect(todayResponse.status).toBe(200);
    expect(todayResponse.body.data.some((showtime: { id: string }) => showtime.id === foreignShowtimeId)).toBe(true);
    expect(attendanceResponse.status).toBe(200);
    expect(attendanceResponse.body.data.showtime.id).toBe(foreignShowtimeId);
  });

  it('sells a ticket directly at the assigned cinema counter', async () => {
    const response = await request(app)
      .post('/api/v1/staff/box-office/sell')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        showtimeId: testShowtimeId,
        seatIds: [availableSeatIds[0]],
        customerName: 'Walk-in customer',
        customerPhone: '0988776655',
        paymentMethod: 'CASH',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.booking.status).toBe('PAID');
    expect(response.body.data.tickets).toHaveLength(1);
    soldBookingId = response.body.data.booking.id;
    soldTicketId = response.body.data.tickets[0].id;
    soldTicketCode = response.body.data.tickets[0].ticketCode;
  });

  it('swaps a broken seat inside the assigned cinema', async () => {
    const response = await request(app)
      .post('/api/v1/staff/seats/swap')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        showtimeId: testShowtimeId,
        ticketId: soldTicketId,
        oldSeatId: availableSeatIds[0],
        newSeatId: availableSeatIds[1],
        reason: 'Broken seat',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.newSeat.id).toBe(availableSeatIds[1]);
  });

  it('checks in a valid ticket at the assigned cinema', async () => {
    const response = await request(app)
      .post('/api/v1/staff/tickets/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ticketCode: soldTicketCode });

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBe(true);
    expect(response.body.data.ticket.isUsed).toBe(true);
  });

  it('rejects scanning the same ticket twice', async () => {
    const response = await request(app)
      .post('/api/v1/staff/tickets/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ticketCode: soldTicketCode });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('TICKET_ALREADY_USED');
  });

  it('returns attendance for a showtime at the assigned cinema', async () => {
    const response = await request(app)
      .get(`/api/v1/staff/showtimes/${testShowtimeId}/attendance`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.metrics.totalBooked).toBeGreaterThanOrEqual(1);
    expect(response.body.data.metrics.totalCheckedIn).toBeGreaterThanOrEqual(1);
  });

  it('denies scanning a ticket from another cinema before mutating it', async () => {
    const response = await request(app)
      .post('/api/v1/staff/tickets/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ticketCode: foreignTicketCode });

    try {
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    } finally {
      await prisma.ticket.update({
        where: { id: foreignTicketId },
        data: { isUsed: false, scannedAt: null, scannedByStaffId: null },
      });
    }
  });

  it('denies a box-office sale for another cinema', async () => {
    const response = await request(app)
      .post('/api/v1/staff/box-office/sell')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        showtimeId: foreignShowtimeId,
        seatIds: [foreignSeatIds[2]],
        paymentMethod: 'CASH',
      });

    try {
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    } finally {
      const unexpectedBookingId = response.body.data?.booking?.id;
      if (unexpectedBookingId) await prisma.booking.deleteMany({ where: { id: unexpectedBookingId } });
    }
  });

  it('denies a seat swap for another cinema before mutating it', async () => {
    const response = await request(app)
      .post('/api/v1/staff/seats/swap')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        showtimeId: foreignShowtimeId,
        ticketId: foreignTicketId,
        oldSeatId: foreignSeatIds[0],
        newSeatId: foreignSeatIds[1],
        reason: 'Cross-cinema attempt',
      });

    try {
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    } finally {
      await prisma.bookingSeat.update({
        where: { id: foreignBookingSeatId },
        data: { seatId: foreignSeatIds[0] },
      });
    }
  });

  it('denies attendance access for another cinema', async () => {
    const response = await request(app)
      .get(`/api/v1/staff/showtimes/${foreignShowtimeId}/attendance`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
