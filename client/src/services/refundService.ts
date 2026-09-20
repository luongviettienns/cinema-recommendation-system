import { mockStorage } from './mockStorage';
import { IBooking } from '../types/booking';

export interface RefundCustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface RefundItem {
  id: string;
  bookingId: string;
  bookingCode: string;
  customer: RefundCustomerInfo;
  movieTitle: string;
  moviePoster?: string;
  cinemaName: string;
  roomName: string;
  startTime: string;
  seats: string[];
  refundAmount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface AdminRefundListResult {
  items: RefundItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProcessRefundPayload {
  action: 'APPROVE' | 'REJECT';
  adminNote?: string;
}

const STORAGE_KEY_REFUNDS = 'cinelight_refund_requests';
const USE_MOCK = true;

const getStoredRefunds = (): RefundItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFUNDS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const setStoredRefunds = (refunds: RefundItem[]): void => {
  localStorage.setItem(STORAGE_KEY_REFUNDS, JSON.stringify(refunds));
};

export const refundService = {
  /**
   * 1. Khách hàng gửi yêu cầu hủy vé
   */
  async requestRefund(bookingId: string, reason: string): Promise<RefundItem> {
    if (USE_MOCK) {
      await new Promise((res) => setTimeout(res, 350));
      const bookings = mockStorage.getBookings();
      const booking = bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);

      if (!booking) {
        throw new Error('Không tìm thấy thông tin đặt vé.');
      }

      // Check idempotent
      const refunds = getStoredRefunds();
      const existing = refunds.find(
        (r) => r.bookingId === booking.id && (r.status === 'PENDING' || r.status === 'APPROVED'),
      );
      if (existing) {
        throw new Error('Giao dịch này đã có yêu cầu hoàn tiền đang được xử lý.');
      }

      // Create refund item
      const newRefund: RefundItem = {
        id: `rf-${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        customer: {
          id: booking.userId || 'demo-user-id',
          name: 'Khách hàng CineLight',
          email: 'customer@cinema.vn',
          phone: '0901234567',
        },
        movieTitle: booking.movieTitle,
        moviePoster: booking.moviePoster,
        cinemaName: booking.cinemaName,
        roomName: booking.roomName,
        startTime: `${booking.showDate}T${booking.showTime}:00`,
        seats: booking.seats,
        refundAmount: booking.totalAmount,
        reason: reason.trim(),
        status: 'PENDING',
        adminNote: null,
        processedAt: null,
        createdAt: new Date().toISOString(),
      };

      // Update in storage
      refunds.unshift(newRefund);
      setStoredRefunds(refunds);

      // Update booking status in mockStorage
      const updatedBookings = bookings.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            paymentStatus: 'pending' as const,
            status: 'REFUND_PENDING' as const,
            refundStatus: 'PENDING' as const,
            refundReason: reason.trim(),
          };
        }
        return b;
      });
      localStorage.setItem('cinelight_bookings', JSON.stringify(updatedBookings));

      return newRefund;
    }

    const token = localStorage.getItem('cinelight_token');
    const response = await fetch('/api/v1/refunds/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, reason }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Không thể gửi yêu cầu hoàn tiền');
    }
    return data.data;
  },

  /**
   * 2. Khách hàng xem lịch sử yêu cầu của mình
   */
  async getMyRefundRequests(): Promise<RefundItem[]> {
    if (USE_MOCK) {
      await new Promise((res) => setTimeout(res, 250));
      return getStoredRefunds();
    }

    const token = localStorage.getItem('cinelight_token');
    const response = await fetch('/api/v1/refunds/my-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Lỗi khi tải lịch sử hoàn tiền');
    }
    return data.data;
  },

  /**
   * 3. Admin xem danh sách yêu cầu (hỗ trợ search, status, page, limit)
   */
  async listAdminRefunds(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminRefundListResult> {
    if (USE_MOCK) {
      await new Promise((res) => setTimeout(res, 300));
      let refunds = getStoredRefunds();

      // Seed a few initial mock requests if empty
      if (refunds.length === 0) {
        refunds = [
          {
            id: 'rf-101',
            bookingId: 'bk-demo-1',
            bookingCode: 'CL-819203',
            customer: {
              id: 'usr-1',
              name: 'Nguyễn Văn An',
              email: 'an.nguyen@gmail.com',
              phone: '0912345678',
            },
            movieTitle: 'Mai',
            moviePoster: 'https://image.tmdb.org/t/p/w500/mai-poster.jpg',
            cinemaName: 'CineLight Landmark 81',
            roomName: 'Phòng Chiếu 01 (IMAX)',
            startTime: new Date(Date.now() + 86400000).toISOString(),
            seats: ['E05', 'E06'],
            refundAmount: 220000,
            reason: 'Có lịch công tác đột xuất tại Hà Nội tối nay.',
            status: 'PENDING',
            adminNote: null,
            processedAt: null,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'rf-102',
            bookingId: 'bk-demo-2',
            bookingCode: 'CL-449102',
            customer: {
              id: 'usr-2',
              name: 'Trần Thị Thu Hà',
              email: 'thuha.tran@gmail.com',
              phone: '0987654321',
            },
            movieTitle: 'Dune: Part Two',
            moviePoster: 'https://image.tmdb.org/t/p/w500/dune-poster.jpg',
            cinemaName: 'CineLight Thủ Đức',
            roomName: 'Phòng Chiếu 02',
            startTime: new Date(Date.now() - 86400000).toISOString(),
            seats: ['F08'],
            refundAmount: 110000,
            reason: 'Bị ốm sốt không thể tới rạp được.',
            status: 'APPROVED',
            adminNote: 'Đã hoàn tiền theo chính sách hỗ trợ sức khỏe.',
            processedAt: new Date(Date.now() - 43200000).toISOString(),
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setStoredRefunds(refunds);
      }

      // Filter by status
      if (query.status && query.status !== 'ALL') {
        refunds = refunds.filter((r) => r.status === query.status);
      }

      // Filter by search
      if (query.search?.trim()) {
        const s = query.search.trim().toLowerCase();
        refunds = refunds.filter(
          (r) =>
            r.bookingCode.toLowerCase().includes(s) ||
            r.customer.name.toLowerCase().includes(s) ||
            r.customer.email.toLowerCase().includes(s),
        );
      }

      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 10));
      const total = refunds.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const items = refunds.slice((page - 1) * limit, page * limit);

      return {
        items,
        pagination: { page, limit, total, totalPages },
      };
    }

    const token = localStorage.getItem('cinelight_token');
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const response = await fetch(`/api/v1/admin/refunds?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Lỗi khi tải danh sách yêu cầu');
    }
    return data.data;
  },

  /**
   * 4. Admin duyệt hoặc từ chối yêu cầu
   */
  async processRefund(id: string, payload: ProcessRefundPayload): Promise<RefundItem> {
    if (USE_MOCK) {
      await new Promise((res) => setTimeout(res, 400));
      const refunds = getStoredRefunds();
      const targetIndex = refunds.findIndex((r) => r.id === id);
      if (targetIndex === -1) {
        throw new Error('Không tìm thấy yêu cầu hoàn tiền');
      }

      const target = refunds[targetIndex];
      const updatedItem: RefundItem = {
        ...target,
        status: payload.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        adminNote: payload.adminNote || (payload.action === 'APPROVE' ? 'Đã chấp thuận hoàn tiền' : ''),
        processedAt: new Date().toISOString(),
      };
      refunds[targetIndex] = updatedItem;
      setStoredRefunds(refunds);

      // Also update booking status in mock bookings
      const bookings = mockStorage.getBookings();
      const updatedBookings = bookings.map((b) => {
        if (b.id === target.bookingId || b.bookingCode === target.bookingCode) {
          return {
            ...b,
            status: payload.action === 'APPROVE' ? ('CANCELLED' as const) : ('PAID' as const),
            paymentStatus: payload.action === 'APPROVE' ? ('failed' as const) : ('completed' as const),
            refundStatus: updatedItem.status,
            adminNote: updatedItem.adminNote || undefined,
          };
        }
        return b;
      });
      localStorage.setItem('cinelight_bookings', JSON.stringify(updatedBookings));

      return updatedItem;
    }

    const token = localStorage.getItem('cinelight_token');
    const response = await fetch(`/api/v1/admin/refunds/${id}/process`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Không thể xử lý yêu cầu hoàn tiền');
    }
    return data.data;
  },

  /**
   * 5. Admin hủy vé khẩn cấp trực tiếp
   */
  async directCancel(bookingId: string, reason: string): Promise<RefundItem> {
    if (USE_MOCK) {
      await new Promise((res) => setTimeout(res, 400));
      const bookings = mockStorage.getBookings();
      const booking = bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);
      if (!booking) {
        throw new Error('Không tìm thấy giao dịch đặt vé');
      }

      const refunds = getStoredRefunds();
      const directRefund: RefundItem = {
        id: `rf-direct-${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        customer: {
          id: booking.userId || 'demo-user-id',
          name: 'Khách hàng CineLight',
          email: 'customer@cinema.vn',
          phone: '0901234567',
        },
        movieTitle: booking.movieTitle,
        moviePoster: booking.moviePoster,
        cinemaName: booking.cinemaName,
        roomName: booking.roomName,
        startTime: `${booking.showDate}T${booking.showTime}:00`,
        seats: booking.seats,
        refundAmount: booking.totalAmount,
        reason,
        status: 'APPROVED',
        adminNote: 'Admin chủ động hủy vé khẩn cấp do sự cố kỹ thuật',
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      refunds.unshift(directRefund);
      setStoredRefunds(refunds);

      // Cancel booking in mock
      const updatedBookings = bookings.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            status: 'CANCELLED' as const,
            paymentStatus: 'failed' as const,
            refundStatus: 'APPROVED' as const,
            adminNote: directRefund.adminNote || undefined,
          };
        }
        return b;
      });
      localStorage.setItem('cinelight_bookings', JSON.stringify(updatedBookings));

      return directRefund;
    }

    const token = localStorage.getItem('cinelight_token');
    const response = await fetch('/api/v1/admin/refunds/direct-cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, reason }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Không thể hủy vé khẩn cấp');
    }
    return data.data;
  },
};
