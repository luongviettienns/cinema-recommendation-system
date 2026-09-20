import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { analyticsService } from '../services/analyticsService';
import { excelExportService } from '../services/excelExportService';
import {
  CreateStaffDTO,
  staffManagementService,
  UpdateStaffDTO,
} from '../services/staffManagementService';

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().trim().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
  assignedCinemaId: z.string().trim().min(1).max(191),
}).strict();

const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  assignedCinemaId: z.string().trim().min(1).max(191).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0);

const optionalQueryString = (maxLength: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().max(maxLength).optional(),
);

const positiveIntegerQuery = (defaultValue: number, maximum: number) => z.preprocess(
  (value) => value === undefined ? String(defaultValue) : value,
  z.string().regex(/^[1-9]\d*$/).transform(Number).refine((value) => value <= maximum),
);

const staffListQuerySchema = z.object({
  search: optionalQueryString(100),
  cinemaId: optionalQueryString(191),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: positiveIntegerQuery(1, 1_000_000),
  limit: positiveIntegerQuery(20, 100),
}).strict();

const sendValidationError = (res: Response) => res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu gửi lên không hợp lệ',
  },
});

export class AdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboardSummary();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async exportRevenueExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as any) || '7days';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const buffer = await excelExportService.generateRevenueWorkbook({
        range,
        startDate,
        endDate,
      });

      const now = new Date();
      const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeString = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `CineLight_BaoCaoDoanhThu_${dateString}_${timeString}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async getRecentBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const bookings = await analyticsService.getRecentBookings({ limit, status, search });
      res.status(200).json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await analyticsService.getUsersList();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, assignedCinemaId } = req.body;

      if (!role || !Object.values(Role).includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: `Quyền không hợp lệ. Chọn một trong các quyền: ${Object.values(Role).join(', ')}`,
          },
        });
      }

      if (
        assignedCinemaId !== undefined &&
        (typeof assignedCinemaId !== 'string' ||
          !assignedCinemaId.trim() ||
          assignedCinemaId.trim().length > 191)
      ) {
        return sendValidationError(res);
      }

      const updatedUser = await staffManagementService.updateUserRole(
        id,
        role as Role,
        assignedCinemaId?.trim(),
      );
      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  async listStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedQuery = staffListQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) return sendValidationError(res);

      const staff = await staffManagementService.list(parsedQuery.data);
      res.status(200).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedBody = createStaffSchema.safeParse(req.body);
      if (!parsedBody.success) return sendValidationError(res);

      const staff = await staffManagementService.create(
        parsedBody.data satisfies CreateStaffDTO,
      );
      res.status(201).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }

  async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedBody = updateStaffSchema.safeParse(req.body);
      if (!parsedBody.success) return sendValidationError(res);

      const staff = await staffManagementService.update(
        req.params.id,
        parsedBody.data satisfies UpdateStaffDTO,
      );
      res.status(200).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
