import { INITIAL_CINEMAS } from '../data/mockCinemas';
import { API_BASE_URL, delay, USE_MOCK } from './api';
import { mockStorage } from './mockStorage';

export interface CinemaOption {
  id: string;
  name: string;
}

export interface StaffSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  assignedCinema: CinemaOption | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  assignedCinemaId: string;
}

export interface UpdateStaffInput {
  name?: string;
  phone?: string;
  assignedCinemaId?: string;
  isActive?: boolean;
}

export interface StaffFilters {
  search?: string;
  cinemaId?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  page?: number;
  limit?: number;
}

export interface StaffPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffListResult {
  items: StaffSummary[];
  pagination: StaffPagination;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

let mockStaff: StaffSummary[] = [
  {
    id: 'staff-demo-1',
    name: 'Nguyễn Minh Anh',
    email: 'minh.anh@cinelight.vn',
    phone: '0901234567',
    isActive: true,
    assignedCinema: { id: INITIAL_CINEMAS[0].id, name: INITIAL_CINEMAS[0].name },
    createdAt: '2026-09-18T08:00:00.000Z',
    updatedAt: '2026-09-18T08:00:00.000Z',
  },
  {
    id: 'staff-demo-2',
    name: 'Lê Khánh Vy',
    email: 'khanh.vy@cinelight.vn',
    phone: '0912345678',
    isActive: false,
    assignedCinema: { id: INITIAL_CINEMAS[1].id, name: INITIAL_CINEMAS[1].name },
    createdAt: '2026-09-15T08:00:00.000Z',
    updatedAt: '2026-09-17T08:00:00.000Z',
  },
];

const apiUrl = (path: string) =>
  `${API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/v1` : API_BASE_URL}${path}`;

const userSafeError = (message: string) =>
  Object.assign(new Error(message), { userSafe: true });

const filterStaff = (members: StaffSummary[], filters: StaffFilters): StaffSummary[] => {
  const search = filters.search?.trim().toLocaleLowerCase('vi-VN') || '';
  return members.filter((member) => {
    const matchesSearch =
      !search ||
      [member.name, member.email, member.assignedCinema?.name || ''].some((value) =>
        value.toLocaleLowerCase('vi-VN').includes(search),
      );
    const matchesCinema =
      !filters.cinemaId || member.assignedCinema?.id === filters.cinemaId;
    const matchesStatus =
      !filters.status ||
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && member.isActive) ||
      (filters.status === 'INACTIVE' && !member.isActive);
    return matchesSearch && matchesCinema && matchesStatus;
  });
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(mockStorage.getToken()
          ? { Authorization: `Bearer ${mockStorage.getToken()}` }
          : {}),
        ...options?.headers,
      },
    });
    const payload = (await response.json().catch(() => undefined)) as
      | ApiResponse<T>
      | undefined;
    if (!response.ok || !payload?.success || payload.data === undefined) {
      throw userSafeError(payload?.error?.message || 'Không thể xử lý yêu cầu nhân viên.');
    }
    return payload.data;
  } catch (error) {
    if (error instanceof Error && 'userSafe' in error) throw error;
    throw new Error('Không thể kết nối tới hệ thống quản trị.');
  }
};

export const getCinemaOptions = async (): Promise<CinemaOption[]> => {
  if (USE_MOCK) {
    await delay(100);
    return INITIAL_CINEMAS.map(({ id, name }) => ({ id, name }));
  }
  return request<CinemaOption[]>('/cinemas');
};

export const listStaff = async (filters: StaffFilters = {}): Promise<StaffListResult> => {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  if (USE_MOCK) {
    await delay(180);
    const filtered = filterStaff(mockStaff, filters);
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  }

  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.cinemaId) query.set('cinemaId', filters.cinemaId);
  if (filters.status && filters.status !== 'ALL') query.set('status', filters.status);
  query.set('page', String(page));
  query.set('limit', String(limit));

  return request<StaffListResult>(`/admin/staff?${query.toString()}`);
};

export const createStaff = async (input: CreateStaffInput): Promise<StaffSummary> => {
  if (USE_MOCK) {
    await delay(220);
    const cinema = (await getCinemaOptions()).find(
      (option) => option.id === input.assignedCinemaId,
    );
    if (!cinema) throw new Error('Không tìm thấy cụm rạp được phân công.');
    if (
      mockStaff.some(
        (member) => member.email.toLowerCase() === input.email.trim().toLowerCase(),
      )
    ) {
      throw new Error('Email này đã được sử dụng.');
    }
    const now = new Date().toISOString();
    const created: StaffSummary = {
      id: `staff-demo-${mockStaff.length + 1}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      isActive: true,
      assignedCinema: cinema,
      createdAt: now,
      updatedAt: now,
    };
    mockStaff = [created, ...mockStaff];
    return created;
  }
  return request<StaffSummary>('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

export const updateStaff = async (
  id: string,
  input: UpdateStaffInput,
): Promise<StaffSummary> => {
  if (USE_MOCK) {
    await delay(180);
    const current = mockStaff.find((member) => member.id === id);
    if (!current) throw new Error('Không tìm thấy tài khoản nhân viên.');
    const cinema = input.assignedCinemaId
      ? (await getCinemaOptions()).find((option) => option.id === input.assignedCinemaId)
      : current.assignedCinema;
    if (!cinema) throw new Error('Không tìm thấy cụm rạp được phân công.');
    const updated: StaffSummary = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      phone: input.phone !== undefined ? input.phone.trim() || null : current.phone,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
      assignedCinema: cinema,
      updatedAt: new Date().toISOString(),
    };
    mockStaff = mockStaff.map((member) => (member.id === id ? updated : member));
    return updated;
  }
  return request<StaffSummary>(`/admin/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};
