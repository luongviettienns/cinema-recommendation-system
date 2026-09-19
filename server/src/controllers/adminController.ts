import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { Role } from '@prisma/client';
import {
  CreateStaffDTO,
  staffManagementService,
  UpdateStaffDTO,
} from '../services/staffManagementService';

const isInvalidOptionalString = (value: unknown): boolean =>
  value !== undefined && typeof value !== 'string';

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

  async listStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await staffManagementService.list();
      res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone, assignedCinemaId } = req.body;
      if (
        !name ||
        !email ||
        !password ||
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        isInvalidOptionalString(phone) ||
        isInvalidOptionalString(assignedCinemaId)
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên',
          },
        });
      }

      const staff = await staffManagementService.create({
        name,
        email,
        password,
        phone,
        assignedCinemaId: assignedCinemaId ?? '',
      } satisfies CreateStaffDTO);
      res.status(201).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, assignedCinemaId, isActive } = req.body;
      if (
        isInvalidOptionalString(name) ||
        isInvalidOptionalString(phone) ||
        isInvalidOptionalString(assignedCinemaId) ||
        (isActive !== undefined && typeof isActive !== 'boolean')
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Trạng thái hoạt động không hợp lệ',
          },
        });
      }

      const staff = await staffManagementService.update(req.params.id, {
        name,
        phone,
        assignedCinemaId,
        isActive,
      } satisfies UpdateStaffDTO);
      res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
