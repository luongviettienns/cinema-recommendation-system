import crypto from 'crypto';
import { prisma } from '../prisma';
import { PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';
import { emailService } from './emailService';

export class PaymentService {
  private webhookSecret =
    process.env.PAYMENT_WEBHOOK_SECRET || 'cinelight-payment-webhook-secret-2026-secure';
  private qrSecret =
    process.env.TICKET_QR_SECRET ||
    process.env.HMAC_QR_SECRET ||
    'cinelight-ticket-qr-secret-2026-distinct';

  /**
   * Create payment intent for booking
   */
  async createPaymentIntent(
    userId: string,
    bookingId: string,
    paymentMethod: PaymentMethod = PaymentMethod.VIETQR
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showtime: {
          include: { movie: true },
        },
      },
    });

    if (!booking) {
      const err = new Error('Không tìm thấy thông tin đơn đặt vé');
      (err as any).statusCode = 404;
      (err as any).code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (booking.userId !== userId) {
      const err = new Error('Bạn không có quyền thanh toán cho đơn đặt vé này');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    if (booking.status === BookingStatus.PAID) {
      const err = new Error('Đơn đặt vé này đã được thanh toán thành công');
      (err as any).statusCode = 400;
      (err as any).code = 'BOOKING_ALREADY_PAID';
      throw err;
    }

    if (booking.status === BookingStatus.CANCELLED) {
      const err = new Error('Đơn đặt vé này đã bị hủy bỏ. Vui lòng đặt lại vé');
      (err as any).statusCode = 400;
      (err as any).code = 'BOOKING_ALREADY_CANCELLED';
      throw err;
    }

    // Check if hold has expired
    const now = new Date();
    if (booking.expiresAt <= now) {
      // Lazy release
      await prisma.bookingSeat.deleteMany({ where: { bookingId } });
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      const err = new Error('Thời gian giữ ghế (7 phút) đã hết hạn. Vui lòng đặt lại ghế');
      (err as any).statusCode = 400;
      (err as any).code = 'HOLDING_EXPIRED';
      throw err;
    }

    // Upsert payment record
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      update: {
        paymentMethod,
        amount: booking.totalAmount,
        status: PaymentStatus.PENDING,
      },
      create: {
        bookingId,
        paymentMethod,
        amount: booking.totalAmount,
        status: PaymentStatus.PENDING,
      },
    });

    // VietQR sandbox configuration
    const bankInfo = {
      bankName: 'Ngân hàng Quân Đội (MB Bank)',
      bankCode: 'MB',
      accountNumber: '0901234567',
      accountName: 'CONG TY CO PHAN CINELIGHT VIET NAM',
      transferContent: booking.bookingCode,
    };

    const qrCodeUrl = `https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${booking.totalAmount}&addInfo=${encodeURIComponent(
      booking.bookingCode
    )}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

    return {
      paymentId: payment.id,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      amount: booking.totalAmount,
      paymentMethod,
      qrCodeUrl,
      transferContent: booking.bookingCode,
      bankInfo,
      expiresAt: booking.expiresAt,
    };
  }

  /**
   * Process payment gateway webhook with HMAC-SHA512 verification
   */
  async handleWebhook(payload: {
    bookingCode: string;
    transactionId: string;
    amount: number;
    paymentMethod?: PaymentMethod;
    signature: string;
  }) {
    const { bookingCode, transactionId, amount, paymentMethod, signature } = payload;

    if (!bookingCode || !transactionId || !signature) {
      const err = new Error('Thiếu tham số webhook bắt buộc');
      (err as any).statusCode = 400;
      (err as any).code = 'MISSING_WEBHOOK_PARAMS';
      throw err;
    }

    // 1. Verify HMAC-SHA512 signature
    const rawData = `${bookingCode}|${transactionId}|${amount}`;
    const expectedSignature = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(rawData)
      .digest('hex');

    const isMatch =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isMatch) {
      const err = new Error('Chữ ký bảo mật webhook không hợp lệ (HMAC signature mismatch)');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_WEBHOOK_SIGNATURE';
      throw err;
    }

    // 2. Find booking
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: { payment: true, ticket: true },
    });

    if (!booking) {
      const err = new Error(`Không tìm thấy đơn đặt vé với mã: ${bookingCode}`);
      (err as any).statusCode = 404;
      (err as any).code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    // 3. Idempotent check: If already PAID, acknowledge without re-inserting
    if (booking.status === BookingStatus.PAID) {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Giao dịch đã được xử lý trước đó',
        bookingId: booking.id,
        bookingStatus: BookingStatus.PAID,
        ticket: booking.ticket,
      };
    }

    // 4. Amount verification: webhook amount must match booking total
    if (amount !== booking.totalAmount) {
      const err = new Error(
        `Số tiền thanh toán (${amount} VNĐ) không khớp với giá trị đơn hàng (${booking.totalAmount} VNĐ)`
      );
      (err as any).statusCode = 400;
      (err as any).code = 'PAYMENT_AMOUNT_MISMATCH';
      throw err;
    }

    // 5. Booking Status & Expiration checks
    const now = new Date();
    if (booking.status === BookingStatus.CANCELLED) {
      const err = new Error('Đơn đặt vé này đã bị hủy bỏ. Không thể phát hành vé.');
      (err as any).statusCode = 400;
      (err as any).code = 'BOOKING_ALREADY_CANCELLED';
      throw err;
    }

    if (booking.status !== BookingStatus.HOLDING) {
      const err = new Error(`Trạng thái đơn hàng không hợp lệ để thanh toán: ${booking.status}`);
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_BOOKING_STATUS';
      throw err;
    }

    if (booking.expiresAt <= now) {
      // Lazy release seats
      await prisma.bookingSeat.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      });

      const err = new Error('Thời gian giữ chỗ của đơn hàng đã hết hạn. Ghế đã được giải phóng.');
      (err as any).statusCode = 400;
      (err as any).code = 'BOOKING_EXPIRED';
      throw err;
    }

    // 6. Update payment, booking, and issue electronic Ticket in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.upsert({
        where: { bookingId: booking.id },
        update: {
          transactionId,
          status: PaymentStatus.SUCCESS,
          signature,
          paidAt: now,
          paymentMethod: paymentMethod || PaymentMethod.VIETQR,
        },
        create: {
          bookingId: booking.id,
          transactionId,
          amount,
          status: PaymentStatus.SUCCESS,
          signature,
          paidAt: now,
          paymentMethod: paymentMethod || PaymentMethod.VIETQR,
        },
      });

      // Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PAID },
      });

      // Generate Ticket with 8-character uppercase alphanumeric code & collision retry
      let ticket: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const randHex = crypto.randomBytes(4).toString('hex').toUpperCase();
        const ticketCode = `TK-${randHex}`;

        const qrPayload = JSON.stringify({
          ticketCode,
          bookingCode: booking.bookingCode,
          showtimeId: booking.showtimeId,
          userId: booking.userId,
          issuedAt: now.toISOString(),
        });

        const qrSignature = crypto
          .createHmac('sha256', this.qrSecret)
          .update(qrPayload)
          .digest('hex');

        const qrCode = `${Buffer.from(qrPayload).toString('base64')}.${qrSignature}`;

        try {
          ticket = await tx.ticket.create({
            data: {
              bookingId: booking.id,
              ticketCode,
              qrCode,
            },
          });
          break;
        } catch (err: any) {
          if (err.code === 'P2002' && attempt < 2) {
            continue; // retry with fresh ticketCode
          }
          throw err;
        }
      }

      return {
        success: true,
        bookingStatus: BookingStatus.PAID,
        ticket: {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          qrCode: ticket.qrCode,
          isUsed: ticket.isUsed,
        },
      };
    });

    // Asynchronously dispatch confirmation email (non-blocking)
    try {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          user: true,
          showtime: {
            include: { movie: true, room: { include: { cinema: true } } },
          },
          bookingSeats: { include: { seat: true } },
        },
      });

      if (fullBooking && fullBooking.user && fullBooking.user.email) {
        emailService
          .sendTicketConfirmation({
            to: fullBooking.user.email,
            customerName: fullBooking.user.name,
            ticketCode: result.ticket.ticketCode,
            bookingCode: fullBooking.bookingCode,
            movieTitle: fullBooking.showtime.movie.title,
            cinemaName: fullBooking.showtime.room.cinema.name,
            roomName: fullBooking.showtime.room.name,
            startTime: fullBooking.showtime.startTime,
            seats: fullBooking.bookingSeats.map((bs) => bs.seat.seatNumber),
            totalAmount: fullBooking.totalAmount,
          })
          .catch((err) => console.error('Lỗi gửi email xác nhận:', err));
      }
    } catch (e) {
      console.warn('Lỗi chuẩn bị email xác nhận:', e);
    }

    return result;
  }

  /**
   * Query payment status for booking
   */
  async getPaymentStatus(bookingId: string, userId?: string, isAdmin = false) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        ticket: true,
      },
    });

    if (!booking) {
      const err = new Error('Không tìm thấy thông tin đơn đặt vé');
      (err as any).statusCode = 404;
      (err as any).code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (!isAdmin && userId && booking.userId !== userId) {
      const err = new Error('Bạn không có quyền truy cập thông tin thanh toán này');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      bookingStatus: booking.status,
      paymentStatus: booking.payment ? booking.payment.status : 'NOT_INITIATED',
      payment: booking.payment,
      ticket: booking.ticket,
    };
  }
}

export const paymentService = new PaymentService();
