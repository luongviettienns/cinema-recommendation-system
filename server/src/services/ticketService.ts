import crypto from 'crypto';
import { prisma } from '../prisma';

export class TicketService {
  private secret =
    process.env.PAYMENT_WEBHOOK_SECRET || 'cinelight-payment-secret-key-2026';

  /**
   * Get all tickets belonging to logged-in customer
   */
  async getMyTickets(userId: string) {
    const tickets = await prisma.ticket.findMany({
      where: {
        booking: { userId },
      },
      include: {
        booking: {
          include: {
            showtime: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      id: t.id,
      ticketCode: t.ticketCode,
      bookingCode: t.booking.bookingCode,
      qrCode: t.qrCode,
      isUsed: t.isUsed,
      scannedAt: t.scannedAt,
      movie: t.booking.showtime.movie,
      cinema: t.booking.showtime.room.cinema,
      roomName: t.booking.showtime.room.name,
      startTime: t.booking.showtime.startTime,
      endTime: t.booking.showtime.endTime,
      seats: t.booking.bookingSeats.map((bs) => ({
        seatNumber: bs.seat.seatNumber,
        seatType: bs.seat.seatType,
      })),
      totalAmount: t.booking.totalAmount,
    }));
  }

  /**
   * Get ticket details by ticketCode
   */
  async getTicketByCode(ticketCode: string, userId?: string, isStaffOrAdmin = false) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            showtime: {
              include: {
                movie: true,
                room: { include: { cinema: true } },
              },
            },
            bookingSeats: {
              include: { seat: true },
            },
          },
        },
        staff: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      const err = new Error('Không tìm thấy vé xem phim');
      (err as any).statusCode = 404;
      (err as any).code = 'TICKET_NOT_FOUND';
      throw err;
    }

    if (!isStaffOrAdmin && userId && ticket.booking.userId !== userId) {
      const err = new Error('Bạn không có quyền xem thông tin vé này');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    return {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      bookingCode: ticket.booking.bookingCode,
      qrCode: ticket.qrCode,
      isUsed: ticket.isUsed,
      scannedAt: ticket.scannedAt,
      scannedByStaff: ticket.staff?.name,
      movie: ticket.booking.showtime.movie,
      cinema: ticket.booking.showtime.room.cinema,
      roomName: ticket.booking.showtime.room.name,
      startTime: ticket.booking.showtime.startTime,
      endTime: ticket.booking.showtime.endTime,
      seats: ticket.booking.bookingSeats.map((bs) => ({
        seatNumber: bs.seat.seatNumber,
        seatType: bs.seat.seatType,
      })),
      customer: ticket.booking.user,
    };
  }

  /**
   * Check in ticket at cinema gate by staff
   */
  async checkInTicket(staffUserId: string, qrCodeOrTicketCode: string) {
    let ticketCode = qrCodeOrTicketCode;

    // Check if input is an HMAC-signed QR string (base64Payload.signature)
    if (qrCodeOrTicketCode.includes('.')) {
      const parts = qrCodeOrTicketCode.split('.');
      if (parts.length !== 2) {
        const err = new Error('Mã QR vé không hợp lệ (sai định dạng)');
        (err as any).statusCode = 400;
        (err as any).code = 'INVALID_QR_CODE';
        throw err;
      }

      const [base64Payload, signature] = parts;
      try {
        const rawPayload = Buffer.from(base64Payload, 'base64').toString('utf-8');
        const expectedSig = crypto
          .createHmac('sha256', this.secret)
          .update(rawPayload)
          .digest('hex');

        if (
          signature.length !== expectedSig.length ||
          !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
        ) {
          const err = new Error('Mã QR vé không hợp lệ hoặc đã bị chỉnh sửa');
          (err as any).statusCode = 400;
          (err as any).code = 'INVALID_QR_CODE';
          throw err;
        }

        const parsed = JSON.parse(rawPayload);
        ticketCode = parsed.ticketCode;
      } catch (e: any) {
        if (e.code === 'INVALID_QR_CODE') throw e;
        const err = new Error('Không thể giải mã dữ liệu mã QR');
        (err as any).statusCode = 400;
        (err as any).code = 'INVALID_QR_CODE';
        throw err;
      }
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            showtime: {
              include: {
                movie: true,
                room: { include: { cinema: true } },
              },
            },
            bookingSeats: {
              include: { seat: true },
            },
          },
        },
        staff: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      const err = new Error(`Không tìm thấy vé xem phim với mã: ${ticketCode}`);
      (err as any).statusCode = 404;
      (err as any).code = 'TICKET_NOT_FOUND';
      throw err;
    }

    // Double check-in prevention
    if (ticket.isUsed) {
      const scannedTime = ticket.scannedAt
        ? ticket.scannedAt.toLocaleTimeString('vi-VN')
        : 'trước đó';
      const staffName = ticket.staff ? ticket.staff.name : 'Nhân viên khác';
      const err = new Error(
        `Vé này ĐÃ ĐƯỢC SỬ DỤNG lúc ${scannedTime} bởi ${staffName}. Không thể soát vé lại!`
      );
      (err as any).statusCode = 409;
      (err as any).code = 'TICKET_ALREADY_USED';
      throw err;
    }

    // Confirm booking status
    if (ticket.booking.status !== 'PAID') {
      const err = new Error('Đơn đặt vé này chưa được thanh toán thành công');
      (err as any).statusCode = 400;
      (err as any).code = 'BOOKING_NOT_PAID';
      throw err;
    }

    // Mark ticket as used and record audit log
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isUsed: true,
        scannedAt: new Date(),
        scannedByStaffId: staffUserId,
      },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    return {
      message: 'Soát vé thành công! Mời khách vào phòng chiếu.',
      ticketCode: updatedTicket.ticketCode,
      isUsed: updatedTicket.isUsed,
      scannedAt: updatedTicket.scannedAt,
      scannedByStaff: updatedTicket.staff?.name,
      movieTitle: ticket.booking.showtime.movie.title,
      cinemaName: ticket.booking.showtime.room.cinema.name,
      roomName: ticket.booking.showtime.room.name,
      startTime: ticket.booking.showtime.startTime,
      seats: ticket.booking.bookingSeats.map((bs) => bs.seat.seatNumber),
      customerName: ticket.booking.user.name,
    };
  }
}

export const ticketService = new TicketService();
