import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefundManagement } from '../RefundManagement';
import { refundService } from '../../../services/refundService';

vi.mock('../../../services/refundService', () => ({
  refundService: {
    listAdminRefunds: vi.fn(),
    processRefund: vi.fn(),
    directCancel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPendingRefund = {
  id: 'refund-1',
  bookingId: 'booking-1',
  bookingCode: 'CL-TEST01',
  customer: {
    id: 'user-1',
    name: 'Nguyễn Văn A',
    email: 'userA@test.com',
    phone: '0901234567',
  },
  movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
  cinemaName: 'CineLight Quận 1',
  roomName: 'Phòng 01 - IMAX',
  startTime: '2026-09-21T19:00:00.000Z',
  seats: ['E1', 'E2'],
  refundAmount: 220000,
  reason: 'Tôi bận công tác đột xuất vào ngày mai',
  status: 'PENDING' as const,
  adminNote: null,
  processedAt: null,
  createdAt: '2026-09-20T10:00:00.000Z',
};

const mockApprovedRefund = {
  id: 'refund-2',
  bookingId: 'booking-2',
  bookingCode: 'CL-TEST02',
  customer: {
    id: 'user-2',
    name: 'Trần Thị B',
    email: 'userB@test.com',
    phone: '0912345678',
  },
  movieTitle: 'Coyote vs. Acme',
  cinemaName: 'CineLight Thủ Đức',
  roomName: 'Phòng 02',
  startTime: '2026-09-20T18:00:00.000Z',
  seats: ['F5'],
  refundAmount: 95000,
  reason: 'Đặt nhầm suất chiếu',
  status: 'APPROVED' as const,
  adminNote: 'Đã hoàn tiền theo yêu cầu',
  processedAt: '2026-09-20T11:00:00.000Z',
  createdAt: '2026-09-20T09:30:00.000Z',
};

describe('RefundManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refundService.listAdminRefunds).mockImplementation(async (params) => {
      if (params?.status === 'APPROVED') {
        return {
          items: [mockApprovedRefund],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        };
      }
      return {
        items: [mockPendingRefund],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
    });
  });

  it('renders refund list correctly and allows filtering by status tabs', async () => {
    render(<RefundManagement />);

    // Check header and item display
    expect(await screen.findByText('CL-TEST01')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText(/Dune: Hành Tinh Cát/i)).toBeInTheDocument();
    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument();

    // Switch to "Đã hoàn tiền" tab
    const approvedTab = screen.getByRole('button', { name: /đã hoàn tiền/i });
    fireEvent.click(approvedTab);

    await waitFor(() => {
      expect(refundService.listAdminRefunds).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
      );
    });
    expect(await screen.findByText('CL-TEST02')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
  });

  it('opens review modal, requires note for rejection, and submits rejection', async () => {
    vi.mocked(refundService.processRefund).mockResolvedValue({
      ...mockPendingRefund,
      status: 'REJECTED',
      adminNote: 'Lý do không hợp lệ theo quy chế rạp',
      processedAt: new Date().toISOString(),
    });

    render(<RefundManagement />);

    const processBtn = await screen.findByRole('button', { name: /xử lý yêu cầu/i });
    fireEvent.click(processBtn);

    // Modal is opened
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/xét duyệt yêu cầu hoàn tiền/i)).toBeInTheDocument();

    const rejectBtn = screen.getByRole('button', { name: /^từ chối$/i });

    // Click reject without note -> does not submit
    fireEvent.click(rejectBtn);
    expect(refundService.processRefund).not.toHaveBeenCalled();

    // Type note >= 5 characters
    const noteInput = screen.getByLabelText(/ghi chú của admin/i);
    fireEvent.change(noteInput, { target: { value: 'Lý do không hợp lệ theo quy chế rạp' } });

    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(refundService.processRefund).toHaveBeenCalledWith('refund-1', {
        action: 'REJECT',
        adminNote: 'Lý do không hợp lệ theo quy chế rạp',
      });
    });
  });

  it('submits APPROVE action successfully and closes modal', async () => {
    vi.mocked(refundService.processRefund).mockResolvedValue({
      ...mockPendingRefund,
      status: 'APPROVED',
      adminNote: undefined,
      processedAt: new Date().toISOString(),
    });

    render(<RefundManagement />);

    const processBtn = await screen.findByRole('button', { name: /xử lý yêu cầu/i });
    fireEvent.click(processBtn);

    const approveBtn = screen.getByRole('button', { name: /duyệt & hoàn tiền/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(refundService.processRefund).toHaveBeenCalledWith('refund-1', {
        action: 'APPROVE',
        adminNote: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal and restores focus on Escape key', async () => {
    render(<RefundManagement />);

    const processBtn = await screen.findByRole('button', { name: /xử lý yêu cầu/i });
    processBtn.focus();
    fireEvent.click(processBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(processBtn).toHaveFocus();
  });

  it('traps Tab and Shift+Tab focus within the dialog', async () => {
    render(<RefundManagement />);

    const processBtn = await screen.findByRole('button', { name: /xử lý yêu cầu/i });
    fireEvent.click(processBtn);

    const dialog = screen.getByRole('dialog');
    const closeBtn = screen.getByRole('button', { name: /đóng/i });
    const approveBtn = screen.getByRole('button', { name: /duyệt & hoàn tiền/i });

    // Focus last element and press Tab -> should wrap to first element (closeBtn)
    approveBtn.focus();
    expect(approveBtn).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(closeBtn).toHaveFocus();

    // Focus first element and press Shift+Tab -> should wrap to last element (approveBtn)
    closeBtn.focus();
    expect(closeBtn).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(approveBtn).toHaveFocus();
  });

  it('supports emergency cancellation modal submission', async () => {
    vi.mocked(refundService.directCancel).mockResolvedValue({
      ...mockPendingRefund,
      id: 'refund-99',
      bookingId: 'booking-99',
      status: 'APPROVED',
      refundAmount: 180000,
      createdAt: new Date().toISOString(),
    });

    render(<RefundManagement />);

    const emergencyBtn = screen.getByRole('button', { name: /hủy vé khẩn cấp/i });
    fireEvent.click(emergencyBtn);

    expect(screen.getByText(/hủy vé & hoàn tiền khẩn cấp/i)).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/mã vé hoặc mã giao dịch/i);
    fireEvent.change(codeInput, { target: { value: 'CL-EMERGENCY' } });

    const submitBtn = screen.getByRole('button', { name: /xác nhận hủy ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(refundService.directCancel).toHaveBeenCalledWith(
        'CL-EMERGENCY',
        expect.any(String),
      );
    });
  });
});
