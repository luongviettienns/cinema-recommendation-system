import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffManagement } from '../StaffManagement';
import * as adminStaffService from '../../../services/adminStaffService';

vi.mock('../../../services/adminStaffService', () => ({
  listStaff: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  getCinemaOptions: vi.fn(),
}));

const cinemas = [
  { id: 'cinema-1', name: 'CineLight Quận 1' },
  { id: 'cinema-2', name: 'CineLight Thủ Đức' },
];

const staff = {
  id: 'staff-1',
  name: 'Nguyễn Minh Anh',
  email: 'anh@cinema.vn',
  phone: '0901234567',
  isActive: true,
  assignedCinema: cinemas[0],
  createdAt: '2026-09-19T08:00:00.000Z',
  updatedAt: '2026-09-19T08:00:00.000Z',
};

const inactiveStaff = {
  id: 'staff-2',
  name: 'Lê Khánh Vy',
  email: 'vy@cinema.vn',
  phone: '0912345678',
  isActive: false,
  assignedCinema: cinemas[1],
  createdAt: '2026-09-15T08:00:00.000Z',
  updatedAt: '2026-09-17T08:00:00.000Z',
};

describe('StaffManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminStaffService.getCinemaOptions).mockResolvedValue(cinemas);
    vi.mocked(adminStaffService.listStaff).mockResolvedValue({
      items: [staff],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('submits a valid new staff member with the selected cinema assignment', async () => {
    vi.mocked(adminStaffService.createStaff).mockResolvedValue({ ...staff, id: 'staff-3' });
    render(<StaffManagement />);

    await screen.findByText('Nguyễn Minh Anh');
    fireEvent.click(screen.getByRole('button', { name: /thêm nhân viên/i }));
    fireEvent.change(screen.getByLabelText(/họ và tên/i), { target: { value: 'Trần Thu Hà' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'ha@cinema.vn' } });
    fireEvent.change(screen.getByLabelText(/mật khẩu tạm thời/i), { target: { value: 'TempPass123!' } });
    fireEvent.change(screen.getByLabelText(/rạp phụ trách/i), { target: { value: 'cinema-2' } });
    fireEvent.click(screen.getByRole('button', { name: /^tạo nhân viên$/i }));

    await waitFor(() =>
      expect(adminStaffService.createStaff).toHaveBeenCalledWith({
        name: 'Trần Thu Hà',
        email: 'ha@cinema.vn',
        password: 'TempPass123!',
        phone: undefined,
        assignedCinemaId: 'cinema-2',
      }),
    );
  });

  it('shows a loading state before staff data is available', () => {
    vi.mocked(adminStaffService.listStaff).mockReturnValue(new Promise(() => {}));
    render(<StaffManagement />);

    expect(screen.getByText(/đang tải danh sách nhân viên/i)).toBeInTheDocument();
  });

  it('explains when no staff match the current filters', async () => {
    vi.mocked(adminStaffService.listStaff).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    render(<StaffManagement />);

    expect(await screen.findByText(/chưa có nhân viên phù hợp/i)).toBeInTheDocument();
  });

  it('shows a recoverable error when the staff list cannot be loaded', async () => {
    vi.mocked(adminStaffService.listStaff).mockRejectedValue(
      new Error('Không thể tải danh sách nhân viên.'),
    );
    render(<StaffManagement />);

    expect(await screen.findByText(/không thể tải danh sách nhân viên/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
  });

  it('requires confirmation before disabling an active staff account', async () => {
    vi.mocked(adminStaffService.updateStaff).mockResolvedValue({ ...staff, isActive: false });
    render(<StaffManagement />);

    fireEvent.click(await screen.findByRole('button', { name: /khóa tài khoản/i }));
    expect(screen.getByText(/xác nhận khóa tài khoản/i)).toBeInTheDocument();
    expect(adminStaffService.updateStaff).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^xác nhận khóa$/i }));
    await waitFor(() =>
      expect(adminStaffService.updateStaff).toHaveBeenCalledWith('staff-1', { isActive: false }),
    );
  });

  it('requires confirmation before reactivating an inactive staff account', async () => {
    vi.mocked(adminStaffService.listStaff).mockResolvedValue({
      items: [inactiveStaff],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(adminStaffService.updateStaff).mockResolvedValue({ ...inactiveStaff, isActive: true });
    render(<StaffManagement />);

    fireEvent.click(await screen.findByRole('button', { name: /mở khóa/i }));
    expect(screen.getByText(/xác nhận mở khóa tài khoản/i)).toBeInTheDocument();
    expect(adminStaffService.updateStaff).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^xác nhận mở khóa$/i }));
    await waitFor(() =>
      expect(adminStaffService.updateStaff).toHaveBeenCalledWith('staff-2', { isActive: true }),
    );
  });

  it('focuses the confirmation action and restores focus after Escape closes the dialog', async () => {
    render(<StaffManagement />);

    const trigger = await screen.findByRole('button', { name: /khóa tài khoản/i });
    trigger.focus();
    fireEvent.click(trigger);

    const confirmButton = screen.getByRole('button', { name: /^xác nhận khóa$/i });
    await waitFor(() => expect(confirmButton).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('traps Tab and Shift+Tab focus within the dialog', async () => {
    render(<StaffManagement />);

    const trigger = await screen.findByRole('button', { name: /khóa tài khoản/i });
    fireEvent.click(trigger);

    const cancelButton = screen.getByRole('button', { name: /^hủy$/i });
    const confirmButton = screen.getByRole('button', { name: /^xác nhận khóa$/i });

    await waitFor(() => expect(confirmButton).toHaveFocus());

    // Tab from last element (confirmButton) should loop to first element (cancelButton)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(cancelButton).toHaveFocus();

    // Shift+Tab from first element (cancelButton) should loop to last element (confirmButton)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();
  });

  it('renders pagination controls and navigates when multiple pages exist', async () => {
    vi.mocked(adminStaffService.listStaff).mockResolvedValue({
      items: [staff],
      pagination: { page: 1, limit: 1, total: 2, totalPages: 2 },
    });
    render(<StaffManagement />);

    expect(await screen.findByText(/trang/i)).toBeInTheDocument();
    const nextButton = screen.getByRole('button', { name: /sau/i });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /trước/i });
    expect(prevButton).toBeDisabled();

    fireEvent.click(nextButton);
    await waitFor(() =>
      expect(adminStaffService.listStaff).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
  });
});
