import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardOverview } from '../DashboardOverview';
import { analyticsExportService } from '../../../services/analyticsExportService';

vi.mock('../../../services/analyticsExportService', () => ({
  analyticsExportService: {
    exportRevenueExcel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DashboardOverview Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI cards, quick controls, and excel export button correctly', () => {
    render(<DashboardOverview onNavigateToTab={mockNavigate} />);

    // Quick controls
    expect(screen.getByText('Phạm Vi Số Liệu:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hôm nay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7 ngày qua/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tháng này/i })).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /xuất báo cáo excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /làm mới số liệu/i })).toBeInTheDocument();

    // KPI sections
    expect(screen.getByText(/doanh thu tuần này/i)).toBeInTheDocument();
    expect(screen.getByText(/vé bán tuần này/i)).toBeInTheDocument();
    expect(screen.getByText(/top 5 phim bán chạy/i)).toBeInTheDocument();
  });

  it('calls analyticsExportService.exportRevenueExcel with default 7days when clicking export button', async () => {
    vi.mocked(analyticsExportService.exportRevenueExcel).mockResolvedValue(undefined);
    render(<DashboardOverview onNavigateToTab={mockNavigate} />);

    const exportBtn = screen.getByRole('button', { name: /xuất báo cáo excel/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(analyticsExportService.exportRevenueExcel).toHaveBeenCalledWith('7days');
    });
  });

  it('calls analyticsExportService.exportRevenueExcel with today when today filter is selected', async () => {
    vi.mocked(analyticsExportService.exportRevenueExcel).mockResolvedValue(undefined);
    render(<DashboardOverview onNavigateToTab={mockNavigate} />);

    const todayBtn = screen.getByRole('button', { name: /hôm nay/i });
    fireEvent.click(todayBtn);

    const exportBtn = screen.getByRole('button', { name: /xuất báo cáo excel/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(analyticsExportService.exportRevenueExcel).toHaveBeenCalledWith('today');
    });
  });

  it('navigates to corresponding tabs when action item or see all buttons are clicked', () => {
    render(<DashboardOverview onNavigateToTab={mockNavigate} />);

    const seeAllBtn = screen.getByRole('button', { name: /xem tất cả/i });
    fireEvent.click(seeAllBtn);
    expect(mockNavigate).toHaveBeenCalledWith('movies');

    const handleNowText = screen.getByText(/xử lý ngay/i);
    fireEvent.click(handleNowText.closest('div') || handleNowText);
    expect(mockNavigate).toHaveBeenCalledWith('bookings');
  });
});
