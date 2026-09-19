import { Request, Response, NextFunction } from 'express';
import { staffService } from '../services/staffService';

export class StaffController {
  /**
   * POST /api/v1/staff/tickets/scan
   */
  async scanTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const staffUserId = req.user?.id;
      if (!staffUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập tài khoản nhân viên' },
        });
      }

      const { qrCodeSignature, ticketCode } = req.body;
      const target = qrCodeSignature || ticketCode;

      const result = await staffService.scanTicket(staffUserId, target);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/staff/box-office/sell
   */
  async sellBoxOffice(req: Request, res: Response, next: NextFunction) {
    try {
      const staffUserId = req.user?.id;
      if (!staffUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập tài khoản nhân viên' },
        });
      }

      const result = await staffService.sellBoxOfficeTicket(staffUserId, req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Bán vé tại quầy thành công!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/staff/seats/swap
   */
  async swapSeat(req: Request, res: Response, next: NextFunction) {
    try {
      const staffUserId = req.user?.id;
      if (!staffUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập tài khoản nhân viên' },
        });
      }

      const result = await staffService.swapSeat(staffUserId, req.body);
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/staff/showtimes/:id/attendance
   */
  async getShowtimeAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await staffService.getShowtimeAttendance(id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/staff/showtimes/today
   */
  async getTodayShowtimes(req: Request, res: Response, next: NextFunction) {
    try {
      const cinemaId = req.query.cinemaId as string | undefined;
      const result = await staffService.getTodayShowtimes(cinemaId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();
