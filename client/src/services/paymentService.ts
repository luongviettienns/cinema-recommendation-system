import { apiRequest, delay, USE_MOCK } from './api';

export interface PaymentIntent {
  paymentId: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  qrCodeUrl: string;
  transferContent: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export interface PaymentStatusResult {
  bookingId: string;
  paymentStatus: string;
  bookingStatus: string;
  ticket?: {
    ticketCode: string;
    qrCode: string;
    isUsed: boolean;
  };
}

export const paymentService = {
  async createPaymentIntent(bookingId: string, paymentMethod: string = 'VIETQR'): Promise<PaymentIntent> {
    if (!USE_MOCK) {
      try {
        const result = await apiRequest<PaymentIntent>('/v1/payments/create-intent', {
          method: 'POST',
          body: JSON.stringify({ bookingId, paymentMethod }),
        });
        return result;
      } catch (err) {
        console.warn('Backend createPaymentIntent failed, falling back to mock payment intent', err);
      }
    }

    await delay(200);
    return {
      paymentId: `pay-${Date.now()}`,
      bookingId,
      amount: 190000,
      paymentMethod,
      qrCodeUrl: 'https://img.vietqr.io/image/970422-0987654321-compact.png',
      transferContent: `CL-${Math.floor(100000 + Math.random() * 900000)}`,
      bankInfo: {
        bankName: 'MB Bank (Ngân hàng Quân Đội)',
        accountNumber: '0987654321',
        accountHolder: 'CINELIGHT CINEMA VIETNAM',
      },
    };
  },

  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResult> {
    if (!USE_MOCK) {
      try {
        const result = await apiRequest<PaymentStatusResult>(`/v1/payments/${bookingId}/status`);
        return result;
      } catch (err) {
        console.warn(`Backend getPaymentStatus(${bookingId}) failed`, err);
      }
    }

    await delay(150);
    return {
      bookingId,
      paymentStatus: 'SUCCESS',
      bookingStatus: 'PAID',
    };
  },

  async confirmSandboxPayment(bookingId: string): Promise<any> {
    if (!USE_MOCK) {
      try {
        const result = await apiRequest('/v1/payments/sandbox-confirm', {
          method: 'POST',
          body: JSON.stringify({ bookingId }),
        });
        return result;
      } catch (err) {
        console.warn('Backend sandboxConfirm failed', err);
        throw err;
      }
    }
    await delay(200);
    return { success: true };
  },
};
