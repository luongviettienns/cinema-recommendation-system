import dayjs from 'dayjs';
import { BookingStatus, PaymentStatus, Prisma, RefundStatus, Role } from '@prisma/client';
import { prisma } from '../prisma';

export interface RequestRefundDTO {
  bookingId: string;
  reason: string;
}

export interface ProcessRefundDTO {
  action: 'APPROVE' | 'REJECT';
  adminNote?: string;
}

export interface DirectCancelDTO {
  bookingId: string;
  reason: string;
}

export interface AdminRefundListQuery {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const createError = (message: string, statusCode: number, code: string) => {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export class RefundService {
  /**
   * 1. Khách hàng gửi yêu cầu hủy vé
   * Kiểm tra đúng 6 điều kiện theo thứ tự:
   * 1. bookingId hợp lệ, thuộc quyền sở hữu user (hoặc ADMIN)
   * 2. booking.status === PAID
   * 3. diff >= 60 phút trước giờ chiếu
   * 4. Không có vé nào isUsed === true
   * 5. Idempotent check (chưa có PENDING hoặc APPROVED)
   * 6. reason length 5 - 500 chars
   */
  async requestRefund(user: { id: string; role: Role }, dto: RequestRefundDTO) {
    const normalizedReason = dto.reason?.trim();
    if (!normalizedReason || normalizedReason.length < 5 || normalizedReason.length > 500) {
      throw createError('Lý do hủy vé phải từ 5 đến 500 ký tự', 400, 'INVALID_REASON');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        showtime: true,
        ticket: true,
        refundRequest: true,
      },
    });

    // 1. Kiểm tra tồn tại và quyền sở hữu
    if (!booking) {
      throw createError('Không tìm thấy giao dịch đặt vé', 404, 'BOOKING_NOT_FOUND');
    }
    if (booking.userId !== user.id && user.role !== Role.ADMIN) {
      throw createError('Bạn không có quyền yêu cầu hoàn tiền cho giao dịch này', 403, 'FORBIDDEN');
    }

    // Kiểm tra idempotent nếu booking đã có yêu cầu PENDING hoặc APPROVED
    if (
      booking.status === BookingStatus.REFUND_PENDING ||
      (booking.refundRequest &&
        (booking.refundRequest.status === RefundStatus.PENDING ||
          booking.refundRequest.status === RefundStatus.APPROVED))
    ) {
      throw createError(
        'Giao dịch này đã có yêu cầu hoàn tiền đang xử lý hoặc đã hoàn tất',
        409,
        'REFUND_ALREADY_REQUESTED',
      );
    }

    // 2. Kiểm tra trạng thái booking phải là PAID
    if (booking.status !== BookingStatus.PAID) {
      throw createError(
        'Chỉ có thể yêu cầu hoàn tiền cho vé đã thanh toán thành công',
        400,
        'INVALID_BOOKING_STATUS',
      );
    }

    // 3. Kiểm tra mốc thời gian >= 60 phút
    const diffMinutes = dayjs(booking.showtime.startTime).diff(dayjs(), 'minute');
    if (diffMinutes < 60) {
      throw createError(
        'Chỉ được yêu cầu hủy vé tối thiểu 60 phút trước giờ chiếu',
        400,
        'REFUND_TIME_LIMIT_EXCEEDED',
      );
    }

    // 4. Kiểm tra vé chưa soát tại cổng
    if (booking.ticket?.isUsed) {
      throw createError(
        'Vé đã qua cửa soát, không thể yêu cầu hoàn tiền',
        400,
        'TICKET_ALREADY_USED',
      );
    }

    // 5. Kiểm tra idempotent (không có yêu cầu PENDING hoặc APPROVED)
    if (
      booking.refundRequest &&
      (booking.refundRequest.status === RefundStatus.PENDING ||
        booking.refundRequest.status === RefundStatus.APPROVED)
    ) {
      throw createError(
        'Giao dịch này đã có yêu cầu hoàn tiền đang xử lý hoặc đã hoàn tất',
        409,
        'REFUND_ALREADY_REQUESTED',
      );
    }

    // 6. Thực hiện trong 1 transaction nguyên tử
    return prisma.$transaction(async (tx) => {
      let refund;
      if (booking.refundRequest) {
        refund = await tx.refundRequest.update({
          where: { bookingId: booking.id },
          data: {
            userId: booking.userId,
            reason: normalizedReason,
            status: RefundStatus.PENDING,
            refundAmount: booking.totalAmount,
            adminNote: null,
            processedById: null,
            processedAt: null,
          },
        });
      } else {
        refund = await tx.refundRequest.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            reason: normalizedReason,
            status: RefundStatus.PENDING,
            refundAmount: booking.totalAmount,
          },
        });
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.REFUND_PENDING },
      });

      return {
        id: refund.id,
        bookingId: refund.bookingId,
        status: refund.status,
        refundAmount: refund.refundAmount,
        createdAt: refund.createdAt,
      };
    });
  }

  /**
   * 2. Khách hàng xem lịch sử yêu cầu của chính mình
   */
  async getMyRefundRequests(userId: string) {
    const requests = await prisma.refundRequest.findMany({
      where: { userId },
      include: {
        booking: {
          include: {
            showtime: {
              include: {
                movie: { select: { id: true, title: true, poster: true } },
                room: {
                  include: {
                    cinema: { select: { id: true, name: true } },
                  },
                },
              },
            },
            bookingSeats: {
              include: {
                seat: { select: { seatNumber: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => ({
      id: req.id,
      bookingId: req.bookingId,
      bookingCode: req.booking.bookingCode,
      movieTitle: req.booking.showtime.movie.title,
      moviePoster: req.booking.showtime.movie.poster,
      cinemaName: req.booking.showtime.room.cinema.name,
      roomName: req.booking.showtime.room.name,
      startTime: req.booking.showtime.startTime,
      seats: req.booking.bookingSeats.map((bs) => bs.seat.seatNumber),
      refundAmount: req.refundAmount,
      reason: req.reason,
      status: req.status,
      adminNote: req.adminNote,
      processedAt: req.processedAt,
      createdAt: req.createdAt,
    }));
  }

  /**
   * 3. Admin xem danh sách yêu cầu hoàn tiền (hỗ trợ search, status, pagination)
   */
  async listAdminRefunds(query: AdminRefundListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const where: Prisma.RefundRequestWhereInput = {};
    if (query.status && query.status !== 'ALL' && Object.values(RefundStatus).includes(query.status as RefundStatus)) {
      where.status = query.status as RefundStatus;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { booking: { bookingCode: { contains: s } } },
        { user: { name: { contains: s } } },
        { user: { email: { contains: s } } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.refundRequest.count({ where }),
      prisma.refundRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          booking: {
            include: {
              showtime: {
                include: {
                  movie: { select: { title: true } },
                  room: {
                    include: {
                      cinema: { select: { name: true } },
                    },
                  },
                },
              },
              bookingSeats: {
                include: {
                  seat: { select: { seatNumber: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        bookingId: item.bookingId,
        bookingCode: item.booking.bookingCode,
        customer: {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
          phone: item.user.phone,
        },
        movieTitle: item.booking.showtime.movie.title,
        cinemaName: item.booking.showtime.room.cinema.name,
        roomName: item.booking.showtime.room.name,
        startTime: item.booking.showtime.startTime,
        seats: item.booking.bookingSeats.map((bs) => bs.seat.seatNumber),
        refundAmount: item.refundAmount,
        reason: item.reason,
        status: item.status,
        adminNote: item.adminNote,
        processedAt: item.processedAt,
        createdAt: item.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4. Admin duyệt hoặc từ chối yêu cầu (giao dịch nguyên tử prisma.$transaction duy nhất)
   */
  async processRefund(adminId: string, refundId: string, data: ProcessRefundDTO) {
    if (!['APPROVE', 'REJECT'].includes(data.action)) {
      throw createError('Hành động xét duyệt không hợp lệ', 400, 'INVALID_ACTION');
    }

    const adminNote = data.adminNote?.trim();
    if (data.action === 'REJECT') {
      if (!adminNote || adminNote.length < 5) {
        throw createError('Vui lòng nhập lý do từ chối tối thiểu 5 ký tự', 400, 'ADMIN_NOTE_REQUIRED');
      }
    }

    return prisma.$transaction(async (tx) => {
      const refund = await tx.refundRequest.findUnique({
        where: { id: refundId },
        include: { booking: true },
      });

      if (!refund) {
        throw createError('Không tìm thấy yêu cầu hoàn tiền', 404, 'REFUND_NOT_FOUND');
      }

      if (refund.status !== RefundStatus.PENDING) {
        throw createError('Yêu cầu này đã được xử lý trước đó', 400, 'REFUND_ALREADY_PROCESSED');
      }

      if (data.action === 'APPROVE') {
        // 1. Cập nhật RefundRequest
        const updatedRefund = await tx.refundRequest.update({
          where: { id: refundId },
          data: {
            status: RefundStatus.APPROVED,
            processedById: adminId,
            processedAt: new Date(),
            adminNote: adminNote || 'Đã chấp thuận hoàn tiền',
          },
        });

        // 2. Cập nhật Booking -> CANCELLED
        await tx.booking.update({
          where: { id: refund.bookingId },
          data: { status: BookingStatus.CANCELLED },
        });

        // 3. Cập nhật Payment -> REFUNDED
        await tx.payment.updateMany({
          where: { bookingId: refund.bookingId },
          data: { status: PaymentStatus.REFUNDED },
        });

        // 4. Xóa toàn bộ BookingSeat để giải phóng ghế lập tức
        await tx.bookingSeat.deleteMany({
          where: { bookingId: refund.bookingId },
        });

        return {
          message: 'Đã duyệt yêu cầu hoàn tiền thành công và giải phóng ghế',
          refund: updatedRefund,
        };
      } else {
        // Action: REJECT
        // 1. Cập nhật RefundRequest -> REJECTED
        const updatedRefund = await tx.refundRequest.update({
          where: { id: refundId },
          data: {
            status: RefundStatus.REJECTED,
            processedById: adminId,
            processedAt: new Date(),
            adminNote,
          },
        });

        // 2. Khôi phục Booking -> PAID
        await tx.booking.update({
          where: { id: refund.bookingId },
          data: { status: BookingStatus.PAID },
        });

        // 3. Giữ nguyên BookingSeat (không xóa ghế)
        return {
          message: 'Đã từ chối yêu cầu hoàn tiền và khôi phục hiệu lực vé',
          refund: updatedRefund,
        };
      }
    });
  }

  /**
   * 5. Admin hủy vé khẩn cấp trực tiếp (Direct Cancel)
   * Không qua bước PENDING, thực hiện nguyên tử trong 1 $transaction
   */
  async adminDirectCancel(adminId: string, dto: DirectCancelDTO) {
    const reason = dto.reason?.trim() || 'Hủy vé khẩn cấp do sự cố kỹ thuật tại rạp';

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: dto.bookingId },
        include: { refundRequest: true },
      });

      if (!booking) {
        throw createError('Không tìm thấy giao dịch đặt vé', 404, 'BOOKING_NOT_FOUND');
      }

      // Tạo hoặc cập nhật RefundRequest -> APPROVED
      let refund;
      if (booking.refundRequest) {
        refund = await tx.refundRequest.update({
          where: { bookingId: booking.id },
          data: {
            reason,
            status: RefundStatus.APPROVED,
            refundAmount: booking.totalAmount,
            processedById: adminId,
            processedAt: new Date(),
            adminNote: 'Admin chủ động hủy vé khẩn cấp',
          },
        });
      } else {
        refund = await tx.refundRequest.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            reason,
            status: RefundStatus.APPROVED,
            refundAmount: booking.totalAmount,
            processedById: adminId,
            processedAt: new Date(),
            adminNote: 'Admin chủ động hủy vé khẩn cấp',
          },
        });
      }

      // Cập nhật booking -> CANCELLED
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      });

      // Cập nhật payment -> REFUNDED
      await tx.payment.updateMany({
        where: { bookingId: booking.id },
        data: { status: PaymentStatus.REFUNDED },
      });

      // Xóa BookingSeat giải phóng ghế
      await tx.bookingSeat.deleteMany({
        where: { bookingId: booking.id },
      });

      return {
        message: 'Đã hủy vé và hoàn tiền khẩn cấp thành công',
        refund,
      };
    });
  }
}

export const refundService = new RefundService();
