import bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
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

export interface StaffListQuery {
  search?: string;
  cinemaId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  page: number;
  limit: number;
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
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffListResult {
  items: StaffSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
}): StaffSummary => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  phone: staff.phone,
  isActive: staff.isActive,
  assignedCinema: staff.assignedCinema,
  createdAt: staff.createdAt,
  updatedAt: staff.updatedAt,
});

const ensureCinemaExists = async (assignedCinemaId: string | undefined) => {
  const normalizedCinemaId = assignedCinemaId?.trim();
  if (!normalizedCinemaId) {
    throw createError(
      'Nhân viên phải được phân công cho một rạp',
      400,
      'STAFF_CINEMA_REQUIRED',
    );
  }

  const cinema = await prisma.cinema.findUnique({
    where: { id: normalizedCinemaId },
    select: { id: true },
  });

  if (!cinema) {
    throw createError('Không tìm thấy cụm rạp', 404, 'CINEMA_NOT_FOUND');
  }

  return cinema.id;
};

export const staffManagementService = {
  async list(query: StaffListQuery): Promise<StaffListResult> {
    const where: Prisma.UserWhereInput = {
      role: Role.STAFF,
      ...(query.cinemaId ? { assignedCinemaId: query.cinemaId } : {}),
      ...(query.status ? { isActive: query.status === 'ACTIVE' } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { email: { contains: query.search } },
              {
                assignedCinema: {
                  is: { name: { contains: query.search } },
                },
              },
            ],
          }
        : {}),
    };

    const [staff, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: staffSummarySelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: staff.map(toStaffSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
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
        phone: data.phone?.trim() || null,
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
        throw createError(
          'Không thể chỉnh sửa tài khoản quản trị viên',
          403,
          'ADMIN_ACCOUNT_PROTECTED',
        );
      }

      throw createError('Không tìm thấy tài khoản nhân viên', 404, 'STAFF_NOT_FOUND');
    }

    const assignedCinemaId =
      data.assignedCinemaId !== undefined
        ? await ensureCinemaExists(data.assignedCinemaId)
        : existingUser.assignedCinemaId;

    if (!assignedCinemaId) {
      throw createError(
        'Nhân viên phải được phân công cho một rạp',
        400,
        'STAFF_CINEMA_REQUIRED',
      );
    }

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        assignedCinemaId,
      },
      select: staffSummarySelect,
    });

    return toStaffSummary(staff);
  },

  async updateUserRole(userId: string, role: Role, assignedCinemaId?: string) {
    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { role: true, assignedCinemaId: true },
      });

      if (!user) {
        throw createError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
      }
      if (user.role === Role.ADMIN) {
        throw createError(
          'Không thể thay đổi tài khoản quản trị viên',
          403,
          'ADMIN_ACCOUNT_PROTECTED',
        );
      }

      let nextCinemaId: string | null = null;
      if (role === Role.STAFF) {
        if (user.role !== Role.STAFF && !assignedCinemaId?.trim()) {
          throw createError(
            'Nhân viên phải được phân công cho một rạp',
            400,
            'STAFF_CINEMA_REQUIRED',
          );
        }
        nextCinemaId = assignedCinemaId?.trim() || user.assignedCinemaId;
        if (!nextCinemaId) {
          throw createError(
            'Nhân viên phải được phân công cho một rạp',
            400,
            'STAFF_CINEMA_REQUIRED',
          );
        }

        const cinema = await transaction.cinema.findUnique({
          where: { id: nextCinemaId },
          select: { id: true },
        });
        if (!cinema) {
          throw createError('Không tìm thấy cụm rạp', 404, 'CINEMA_NOT_FOUND');
        }
      }

      return transaction.user.update({
        where: { id: userId },
        data: {
          role,
          assignedCinemaId: role === Role.STAFF ? nextCinemaId : null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          assignedCinemaId: true,
          updatedAt: true,
        },
      });
    });
  },
};
