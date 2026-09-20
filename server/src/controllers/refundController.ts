import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { refundService } from '../services/refundService';

const requestRefundSchema = z.object({
  bookingId: z.string().trim().min(1, 'Mã giao dịch đặt vé không được để trống'),
  reason: z.string().trim().min(5, 'Lý do hủy vé phải từ 5 đến 500 ký tự').max(500, 'Lý do hủy vé không được vượt quá 500 ký tự'),
}).strict();

const processRefundSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'Hành động xét duyệt phải là APPROVE hoặc REJECT' }),
  }),
  adminNote: z.string().trim().optional(),
}).strict().refine((data) => {
  if (data.action === 'REJECT') {
    return Boolean(data.adminNote && data.adminNote.trim().length >= 5);
  }
  return true;
}, {
  message: 'Vui lòng nhập lý do từ chối tối thiểu 5 ký tự',
  path: ['adminNote'],
});

const directCancelSchema = z.object({
  bookingId: z.string().trim().min(1, 'Mã giao dịch đặt vé không được để trống'),
  reason: z.string().trim().optional(),
}).strict();

export class RefundController {
  /**
   * Khách hàng gửi yêu cầu hoàn tiền
   */
  async requestRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = requestRefundSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Dữ liệu gửi lên không hợp lệ',
          },
        });
      }

      const user = (req as any).user;
      const result = await refundService.requestRefund(user, parsed.data);

      return res.status(201).json({
        success: true,
        message: 'Yêu cầu hoàn tiền đã được gửi thành công và đang chờ ban quản lý rạp xét duyệt.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Khách hàng xem danh sách yêu cầu hoàn tiền của mình
   */
  async getMyRefundRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const data = await refundService.getMyRefundRequests(user.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin xem danh sách yêu cầu hoàn tiền
   */
  async listAdminRefunds(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await refundService.listAdminRefunds({
        status: status as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin duyệt hoặc từ chối yêu cầu
   */
  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = processRefundSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Dữ liệu gửi lên không hợp lệ',
          },
        });
      }

      const { id } = req.params;
      const adminId = (req as any).user.id;
      const result = await refundService.processRefund(adminId, id, parsed.data);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.refund,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin hủy vé và hoàn tiền khẩn cấp
   */
  async directCancel(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = directCancelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Dữ liệu gửi lên không hợp lệ',
          },
        });
      }

      const adminId = (req as any).user.id;
      const result = await refundService.adminDirectCancel(adminId, {
        bookingId: parsed.data.bookingId,
        reason: parsed.data.reason || 'Admin hủy vé khẩn cấp',
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.refund,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const refundController = new RefundController();
