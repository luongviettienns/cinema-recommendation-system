import { prisma } from '../prisma';
import { ticketService } from './ticketService';
import { BookingStatus, PaymentStatus, PaymentMethod, SeatType } from '@prisma/client';
import crypto from 'crypto';

export class StaffService {
  private secret =
    process.env.PAYMENT_WEBHOOK_SECRET || 'cinelight-payment-secret-key-2026';

  /**
   * 1. Soát vé QR / Check-in tại cổng rạp (quét liên tục, chống quét 2 lần)
   */
  async scanTicket(staffUserId: string, qrCodeOrTicketCode: string) {
    if (!qrCodeOrTicketCode || !qrCodeOrTicketCode.trim()) {
      const err = new Error('Mã vé hoặc mã QR không được để trống');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_INPUT';
      throw err;
    }

    const result = await ticketService.checkInTicket(staffUserId, qrCodeOrTicketCode.trim());
    return {
      valid: true,
      message: 'Soát vé thành công — Khách được phép vào rạp!',
      ticket: result,
      checkedInAt: result.scannedAt,
    };
  }

  /**
   * 2. Bán vé tại quầy (Box Office Walk-in Sale)
   * Thu tiền mặt hoặc thẻ tại quầy, tạo vé PAID và mã QR ngay lập tức không qua giữ chỗ 7 phút
   */
  async sellBoxOfficeTicket(
    staffUserId: string,
    data: {
      showtimeId: string;
      seatIds: string[];
      customerName?: string;
      customerPhone?: string;
      paymentMethod?: PaymentMethod;
    }
  ) {
    const { showtimeId, seatIds, customerName, customerPhone, paymentMethod = PaymentMethod.CASH } = data;

    if (!showtimeId || !seatIds || seatIds.length === 0) {
      const err = new Error('Vui lòng chọn suất chiếu và ít nhất 1 ghế ngồi');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_INPUT';
      throw err;
    }

    // 1. Fetch showtime with room and seats
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        room: {
          include: { cinema: true },
        },
      },
    });

    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu được yêu cầu');
      (err as any).statusCode = 404;
      (err as any).code = 'SHOWTIME_NOT_FOUND';
      throw err;
    }

    // 2. Check if seats belong to room
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        roomId: showtime.roomId,
      },
    });

    if (seats.length !== seatIds.length) {
      const err = new Error('Một số ghế đã chọn không tồn tại trong phòng chiếu này');
      (err as any).statusCode = 400;
      (err as any).code = 'SEAT_NOT_FOUND';
      throw err;
    }

    // Calculate total price based on seat types
    let totalAmount = 0;
    const seatPrices: { seatId: string; price: number }[] = [];
    for (const seat of seats) {
      let price = showtime.basePrice;
      if (seat.seatType === SeatType.VIP) {
        price += 20000;
      } else if (seat.seatType === SeatType.COUPLE) {
        price += 40000;
      }
      totalAmount += price;
      seatPrices.push({ seatId: seat.id, price });
    }

    // Transaction to safely sell tickets directly
    const result = await prisma.$transaction(async (tx) => {
      // Verify no seat is already taken
      const occupiedSeats = await tx.bookingSeat.findMany({
        where: {
          showtimeId,
          seatId: { in: seatIds },
          booking: {
            OR: [
              { status: BookingStatus.PAID },
              {
                status: BookingStatus.HOLDING,
                expiresAt: { gt: new Date() },
              },
            ],
          },
        },
        include: { seat: true },
      });

      if (occupiedSeats.length > 0) {
        const seatNames = occupiedSeats.map((os) => os.seat.seatNumber).join(', ');
        const err = new Error(`Ghế [${seatNames}] đã có người đặt hoặc đang giữ chỗ. Vui lòng chọn ghế khác.`);
        (err as any).statusCode = 409;
        (err as any).code = 'SEAT_ALREADY_TAKEN';
        throw err;
      }

      // Generate unique booking code
      const bookingCode = `BX-${Date.now().toString().slice(-6)}`;

      // Create Booking with PAID status
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId: staffUserId,
          showtimeId,
          totalAmount,
          status: BookingStatus.PAID,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // Paid booking doesn't expire in 7m
        },
      });

      // Create booking_seats
      for (const sp of seatPrices) {
        await tx.bookingSeat.create({
          data: {
            bookingId: booking.id,
            showtimeId,
            seatId: sp.seatId,
            price: sp.price,
          },
        });
      }

      // Create payment record
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          paymentMethod,
          transactionId: `TXN-${bookingCode}`,
          status: PaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      // Generate single composite ticket for this booking
      const seatListStr = seats.map((s) => s.seatNumber).join(', ');
      const ticketCode = `TK-${bookingCode}`;
      const qrPayload = JSON.stringify({
        ticketCode,
        bookingCode,
        movie: showtime.movie.title,
        cinema: showtime.room.cinema.name,
        room: showtime.room.name,
        seats: seatListStr,
        showtime: showtime.startTime.toISOString(),
        createdAt: new Date().toISOString(),
      });

      const base64Payload = Buffer.from(qrPayload).toString('base64');
      const signature = crypto
        .createHmac('sha256', this.secret)
        .update(qrPayload)
        .digest('hex');
      const qrCodeString = `${base64Payload}.${signature}`;

      const ticket = await tx.ticket.create({
        data: {
          ticketCode,
          bookingId: booking.id,
          qrCode: qrCodeString,
          isUsed: false,
        },
      });

      return {
        booking,
        ticket,
        tickets: [
          {
            ...ticket,
            seats: seatListStr,
          },
        ],
        showtime: {
          movieTitle: showtime.movie.title,
          cinemaName: showtime.room.cinema.name,
          roomName: showtime.room.name,
          startTime: showtime.startTime,
        },
        customer: {
          name: customerName || 'Khách Mua Tại Quầy',
          phone: customerPhone || 'Tại quầy',
        },
        paymentMethod,
        totalAmount,
      };
    });

    return result;
  }

  /**
   * 3. Xử lý sự cố đổi ghế tại chỗ (ghế hỏng/trục trặc sát giờ chiếu)
   */
  async swapSeat(
    staffUserId: string,
    data: {
      showtimeId: string;
      ticketId: string;
      oldSeatId: string;
      newSeatId: string;
      reason?: string;
    }
  ) {
    const { showtimeId, ticketId, oldSeatId, newSeatId, reason = 'Ghế hỏng/sự cố kỹ thuật' } = data;

    if (!showtimeId || !ticketId || !oldSeatId || !newSeatId) {
      const err = new Error('Thiếu thông tin yêu cầu đổi ghế sự cố');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_INPUT';
      throw err;
    }

    if (oldSeatId === newSeatId) {
      const err = new Error('Ghế mới không được trùng với ghế cũ');
      (err as any).statusCode = 400;
      (err as any).code = 'SAME_SEAT';
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Verify ticket and booking
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: {
          booking: {
            include: {
              bookingSeats: { include: { seat: true } },
              showtime: {
                include: { movie: true, room: { include: { cinema: true } } },
              },
            },
          },
        },
      });

      if (!ticket) {
        const err = new Error('Không tìm thấy vé cần đổi ghế');
        (err as any).statusCode = 404;
        (err as any).code = 'TICKET_NOT_FOUND';
        throw err;
      }

      // 2. Verify new seat belongs to the same room
      const newSeat = await tx.seat.findUnique({
        where: { id: newSeatId },
      });

      if (!newSeat || newSeat.roomId !== ticket.booking.showtime.roomId) {
        const err = new Error('Ghế mới không tồn tại trong cùng phòng chiếu này');
        (err as any).statusCode = 400;
        (err as any).code = 'INVALID_ROOM_SEAT';
        throw err;
      }

      // 3. Verify new seat is AVAILABLE
      const taken = await tx.bookingSeat.findFirst({
        where: {
          showtimeId,
          seatId: newSeatId,
          booking: {
            OR: [
              { status: BookingStatus.PAID },
              {
                status: BookingStatus.HOLDING,
                expiresAt: { gt: new Date() },
              },
            ],
          },
        },
      });

      if (taken) {
        const err = new Error(`Ghế ${newSeat.seatNumber} hiện không trống. Vui lòng chọn ghế khác.`);
        (err as any).statusCode = 409;
        (err as any).code = 'SEAT_NOT_AVAILABLE';
        throw err;
      }

      // 4. Update the bookingSeat record
      const existingBS = await tx.bookingSeat.findFirst({
        where: {
          bookingId: ticket.bookingId,
          showtimeId,
          seatId: oldSeatId,
        },
      });

      if (existingBS) {
        await tx.bookingSeat.update({
          where: { id: existingBS.id },
          data: { seatId: newSeatId },
        });
      } else {
        await tx.bookingSeat.create({
          data: {
            bookingId: ticket.bookingId,
            showtimeId,
            seatId: newSeatId,
            price: ticket.booking.showtime.basePrice,
          },
        });
      }

      return {
        success: true,
        message: `Đã đổi thành công từ ghế cũ sang ghế mới ${newSeat.seatNumber}`,
        ticketCode: ticket.ticketCode,
        newSeat: {
          id: newSeat.id,
          label: newSeat.seatNumber,
          type: newSeat.seatType,
        },
        reason,
        handledBy: staffUserId,
      };
    });
  }

  /**
   * 4. Đối chiếu sĩ số phòng chiếu của 1 suất chiếu đang diễn ra
   */
  async getShowtimeAttendance(showtimeId: string) {
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        room: {
          include: {
            cinema: true,
            seats: true,
          },
        },
      },
    });

    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu');
      (err as any).statusCode = 404;
      (err as any).code = 'SHOWTIME_NOT_FOUND';
      throw err;
    }

    // Get all paid tickets for this showtime
    const tickets = await prisma.ticket.findMany({
      where: {
        booking: {
          showtimeId,
          status: BookingStatus.PAID,
        },
      },
      include: {
        booking: {
          include: {
            user: { select: { name: true, phone: true } },
            bookingSeats: { include: { seat: true } },
          },
        },
        staff: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalCapacity = showtime.room.seats.length;
    const totalBooked = tickets.length;
    const totalCheckedIn = tickets.filter((t) => t.isUsed).length;
    const remainingUnchecked = totalBooked - totalCheckedIn;

    const attendees = tickets.map((t) => {
      const seatList = t.booking.bookingSeats.map((bs) => bs.seat.seatNumber).join(', ');
      return {
        ticketId: t.id,
        ticketCode: t.ticketCode,
        seatLabel: seatList || 'N/A',
        seatType: t.booking.bookingSeats[0]?.seat?.seatType || 'REGULAR',
        customerName: t.booking.user?.name || 'Khách vãng lai',
        customerPhone: t.booking.user?.phone || 'N/A',
        isUsed: t.isUsed,
        scannedAt: t.scannedAt,
        checkedInBy: t.staff?.name || null,
      };
    });

    return {
      showtime: {
        id: showtime.id,
        movieTitle: showtime.movie.title,
        moviePoster: showtime.movie.poster,
        cinemaName: showtime.room.cinema.name,
        roomName: showtime.room.name,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
      },
      metrics: {
        totalCapacity,
        totalBooked,
        totalCheckedIn,
        remainingUnchecked,
        occupancyRate: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
        checkinRate: totalBooked > 0 ? Math.round((totalCheckedIn / totalBooked) * 100) : 0,
      },
      attendees,
    };
  }

  /**
   * 5. Lấy danh sách suất chiếu hôm nay phục vụ tác nghiệp tại quầy & cửa soát vé
   */
  async getTodayShowtimes(cinemaId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (cinemaId) {
      whereClause.room = { cinemaId };
    }

    const showtimes = await prisma.showtime.findMany({
      where: whereClause,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
            duration: true,
            ageRating: true,
          },
        },
        room: {
          include: {
            cinema: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            bookingSeats: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return showtimes.map((st) => ({
      id: st.id,
      movie: st.movie,
      cinema: st.room.cinema,
      room: {
        id: st.room.id,
        name: st.room.name,
        roomType: st.room.roomType,
        capacity: 80,
      },
      startTime: st.startTime,
      endTime: st.endTime,
      format: st.format,
      basePrice: st.basePrice,
      bookedSeatsCount: st._count.bookingSeats,
    }));
  }
}

export const staffService = new StaffService();
