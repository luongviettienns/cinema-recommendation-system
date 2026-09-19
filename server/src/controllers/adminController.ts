import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { Role } from '@prisma/client';

export class AdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboardSummary();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const bookings = await analyticsService.getRecentBookings(limit);
      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await analyticsService.getUsersList();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !Object.values(Role).includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: `Quyền không hợp lệ. Chọn một trong các quyền: ${Object.values(Role).join(', ')}`,
          },
        });
      }

      const updatedUser = await analyticsService.updateUserRole(id, role as Role);
      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
