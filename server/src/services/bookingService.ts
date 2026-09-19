import { prisma } from '../prisma';
import { BookingStatus, SeatType } from '@prisma/client';

export class BookingService {
  /**
   * Hold seats for 7 minutes (420 seconds) with concurrency transaction control
   */
  async holdSeats(userId: string, showtimeId: string, seatIds: string[]) {
    if (!seatIds || seatIds.length === 0) {
      const err = new Error('Vui lòng chọn ít nhất một ghế');
      (err as any).statusCode = 400;
      (err as any).code = 'SEAT_REQUIRED';
      throw err;
    }

    if (seatIds.length > 8) {
      const err = new Error('Mỗi giao dịch chỉ được giữ tối đa 8 ghế');
      (err as any).statusCode = 400;
      (err as any).code = 'MAX_SEATS_EXCEEDED';
      throw err;
    }

    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        room: { include: { cinema: true } },
      },
    });

    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu');
      (err as any).statusCode = 404;
      (err as any).code = 'SHOWTIME_NOT_FOUND';
      throw err;
    }

    // Run transaction with serializable-level checks
    try {
      return await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Lazy cleanup: Expire any stale holds for this showtime
      const expiredBookings = await tx.booking.findMany({
        where: {
          showtimeId,
          status: 'HOLDING',
          expiresAt: { lte: now },
        },
        select: { id: true },
      });

      if (expiredBookings.length > 0) {
        const expiredIds = expiredBookings.map((b) => b.id);
        await tx.bookingSeat.deleteMany({
          where: { bookingId: { in: expiredIds } },
        });
        await tx.booking.updateMany({
          where: { id: { in: expiredIds } },
          data: { status: BookingStatus.CANCELLED },
        });
      }

      // 2. Check if any requested seat is currently booked or held by an active session
      const conflictingBookingSeats = await tx.bookingSeat.findMany({
        where: {
          showtimeId,
          seatId: { in: seatIds },
          booking: {
            OR: [
              { status: BookingStatus.PAID },
              {
                status: BookingStatus.HOLDING,
                expiresAt: { gt: now },
              },
            ],
          },
        },
        include: { seat: true },
      });

      if (conflictingBookingSeats.length > 0) {
        const seatNumbers = conflictingBookingSeats.map((bs) => bs.seat.seatNumber).join(', ');
        const err = new Error(
          `Ghế [${seatNumbers}] đã có người giữ hoặc đặt chỗ trước. Vui lòng chọn ghế khác.`
        );
        (err as any).statusCode = 409;
        (err as any).code = 'SEAT_ALREADY_HOLDING_OR_BOOKED';
        throw err;
      }

      // 3. Verify seat existence in the showtime's room
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          roomId: showtime.roomId,
        },
      });

      if (seats.length !== seatIds.length) {
        const err = new Error('Một số ghế được chọn không thuộc phòng chiếu này');
        (err as any).statusCode = 400;
        (err as any).code = 'INVALID_SEATS';
        throw err;
      }

      // 4. Calculate pricing per seat type
      let totalAmount = 0;
      const seatPriceMap = new Map<string, number>();

      for (const seat of seats) {
        let price = showtime.basePrice;
        if (seat.seatType === SeatType.VIP) {
          price += 20000;
        } else if (seat.seatType === SeatType.COUPLE) {
          price = showtime.basePrice * 2 + 20000;
        }
        seatPriceMap.set(seat.id, price);
        totalAmount += price;
      }

      // 5. Expiration countdown: Strictly 7 minutes (420 seconds)
      const HOLD_DURATION_SECONDS = 420;
      const expiresAt = new Date(now.getTime() + HOLD_DURATION_SECONDS * 1000);
      const bookingCode = `CL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 6. Create booking record
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId,
          showtimeId,
          status: BookingStatus.HOLDING,
          totalAmount,
          expiresAt,
        },
      });

      // 7. Create booking_seat records (protected by unique([showtimeId, seatId]))
      for (const seat of seats) {
        await tx.bookingSeat.create({
          data: {
            bookingId: booking.id,
            seatId: seat.id,
            showtimeId,
            price: seatPriceMap.get(seat.id) || showtime.basePrice,
          },
        });
      }

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        totalAmount: booking.totalAmount,
        expiresAt: booking.expiresAt,
        holdingSecondsRemaining: HOLD_DURATION_SECONDS,
        movie: {
          title: showtime.movie.title,
          poster: showtime.movie.poster,
          duration: showtime.movie.duration,
          format: showtime.format,
        },
        cinema: {
          name: showtime.room.cinema.name,
          address: showtime.room.cinema.address,
          roomName: showtime.room.name,
        },
        showtime: {
          startTime: showtime.startTime,
          endTime: showtime.endTime,
        },
        seats: seats.map((s) => ({
          id: s.id,
          seatNumber: s.seatNumber,
          seatType: s.seatType,
          price: seatPriceMap.get(s.id),
        })),
      };
    });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const err = new Error(
          'Ghế bạn chọn vừa có người khác giữ hoặc đặt trước. Vui lòng chọn ghế khác.'
        );
        (err as any).statusCode = 409;
        (err as any).code = 'SEAT_ALREADY_HOLDING_OR_BOOKED';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Release held seats immediately (user aborts or changes mind)
   */
  async releaseBooking(userId: string, bookingId: string, isAdmin = false) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      const err = new Error('Không tìm thấy giao dịch đặt vé');
      (err as any).statusCode = 404;
      (err as any).code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (!isAdmin && booking.userId !== userId) {
      const err = new Error('Bạn không có quyền thực hiện thao tác này');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    if (booking.status === BookingStatus.PAID) {
      const err = new Error('Không thể hủy giao dịch đã thanh toán thành công');
      (err as any).statusCode = 400;
      (err as any).code = 'CANNOT_CANCEL_PAID_BOOKING';
      throw err;
    }

    // Delete booking seats to free up unique constraint
    await prisma.bookingSeat.deleteMany({
      where: { bookingId },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    return { message: 'Đã giải phóng ghế giữ chỗ thành công' };
  }

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId: string, userId?: string, isAdmin = false) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showtime: {
          include: {
            movie: true,
            room: { include: { cinema: true } },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        payment: true,
        ticket: true,
      },
    });

    if (!booking) {
      const err = new Error('Không tìm thấy giao dịch đặt vé');
      (err as any).statusCode = 404;
      (err as any).code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (!isAdmin && userId && booking.userId !== userId) {
      const err = new Error('Bạn không có quyền xem thông tin giao dịch này');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    const now = new Date();
    const remainingSeconds = Math.max(
      0,
      Math.floor((booking.expiresAt.getTime() - now.getTime()) / 1000)
    );

    return {
      ...booking,
      holdingSecondsRemaining: booking.status === BookingStatus.HOLDING ? remainingSeconds : 0,
    };
  }

  /**
   * Get user booking history
   */
  async getMyBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        showtime: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                poster: true,
                duration: true,
              },
            },
            room: {
              include: {
                cinema: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        payment: true,
        ticket: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }
}

export const bookingService = new BookingService();
