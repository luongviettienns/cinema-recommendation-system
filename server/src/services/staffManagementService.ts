import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

export interface CreateStaffDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  assignedCinemaId: string;
}

export interface UpdateStaffDTO {
  name?: string;
  phone?: string;
  assignedCinemaId?: string;
  isActive?: boolean;
}

export interface StaffSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  assignedCinema: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const staffSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  assignedCinema: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const createError = (message: string, statusCode: number, code: string) => {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const toStaffSummary = (staff: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedCinema: { id: string; name: string } | null;
}): StaffSummary => {
  if (!staff.assignedCinema) {
    throw createError('Nhân viên phải được phân công cho một rạp', 400, 'STAFF_CINEMA_REQUIRED');
  }

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    isActive: staff.isActive,
    assignedCinema: staff.assignedCinema,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
};

const ensureCinemaExists = async (assignedCinemaId: string | undefined) => {
  if (!assignedCinemaId?.trim()) {
    throw createError('Nhân viên phải được phân công cho một rạp', 400, 'STAFF_CINEMA_REQUIRED');
  }

  const cinema = await prisma.cinema.findUnique({
    where: { id: assignedCinemaId },
    select: { id: true },
  });

  if (!cinema) {
    throw createError('Không tìm thấy cụm rạp', 404, 'CINEMA_NOT_FOUND');
  }

  return cinema.id;
};

export const staffManagementService = {
  async list(): Promise<StaffSummary[]> {
    const staff = await prisma.user.findMany({
      where: { role: Role.STAFF },
      select: staffSummarySelect,
      orderBy: { createdAt: 'desc' },
    });

    return staff.map(toStaffSummary);
  },

  async create(data: CreateStaffDTO): Promise<StaffSummary> {
    const assignedCinemaId = await ensureCinemaExists(data.assignedCinemaId);
    const email = data.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw createError('Email này đã được sử dụng', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const password = await bcrypt.hash(data.password, 10);
    const staff = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password,
        phone: data.phone?.trim(),
        role: Role.STAFF,
        isActive: true,
        assignedCinemaId,
      },
      select: staffSummarySelect,
    });

    return toStaffSummary(staff);
  },

  async update(staffId: string, data: UpdateStaffDTO): Promise<StaffSummary> {
    const existingUser = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        role: true,
        assignedCinemaId: true,
      },
    });

    if (!existingUser || existingUser.role !== Role.STAFF) {
      if (existingUser?.role === Role.ADMIN) {
        throw createError('Không thể chỉnh sửa tài khoản quản trị viên', 403, 'ADMIN_ACCOUNT_PROTECTED');
      }

      throw createError('Không tìm thấy tài khoản nhân viên', 404, 'STAFF_NOT_FOUND');
    }

    const assignedCinemaId =
      data.assignedCinemaId !== undefined
        ? await ensureCinemaExists(data.assignedCinemaId)
        : existingUser.assignedCinemaId;

    if (!assignedCinemaId) {
      throw createError('Nhân viên phải được phân công cho một rạp', 400, 'STAFF_CINEMA_REQUIRED');
    }

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        assignedCinemaId,
      },
      select: staffSummarySelect,
    });

    return toStaffSummary(staff);
  },
};
