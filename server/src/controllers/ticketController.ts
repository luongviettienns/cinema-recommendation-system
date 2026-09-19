import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticketService';

export class TicketController {
  async getMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const tickets = await ticketService.getMyTickets(userId);

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTicketByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const isStaffOrAdmin = req.user?.role === 'STAFF' || req.user?.role === 'ADMIN';
      const { ticketCode } = req.params;

      const ticket = await ticketService.getTicketByCode(ticketCode, userId, isStaffOrAdmin);

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkInTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const staffUserId = req.user!.id;
      const { qrCode, ticketCode } = req.body;

      const codeToVerify = qrCode || ticketCode;
      if (!codeToVerify) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng cung cấp mã qrCode hoặc ticketCode để soát vé',
          },
        });
      }

      const result = await ticketService.checkInTicket(staffUserId, codeToVerify);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
