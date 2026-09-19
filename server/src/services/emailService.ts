import nodemailer from 'nodemailer';

export interface TicketEmailPayload {
  to: string;
  customerName: string;
  ticketCode: string;
  bookingCode: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  startTime: Date | string;
  seats: string[];
  totalAmount: number;
  qrCodeUrl?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Send booking confirmation and electronic ticket details to customer
   */
  async sendTicketConfirmation(payload: TicketEmailPayload) {
    const formattedDate = new Date(payload.startTime).toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 32px 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CINELIGHT CINEMA</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Vé Xem Phim Điện Tử (E-Ticket)</p>
        </div>
        
        <div style="padding: 28px 24px;">
          <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Xin chào <strong>${payload.customerName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0;">Cảm ơn bạn đã lựa chọn CineLight. Đơn đặt vé của bạn đã thanh toán thành công!</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">${payload.movieTitle}</h2>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Rạp:</strong> ${payload.cinemaName}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Phòng chiếu:</strong> ${payload.roomName}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Suất chiếu:</strong> ${formattedDate}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Số ghế:</strong> <span style="color: #e11d48; font-weight: 700;">${payload.seats.join(', ')}</span></p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Tổng tiền:</strong> ${payload.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
          </div>

          <div style="text-align: center; background: #fff1f2; border: 1px dashed #fda4af; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #9f1239; margin: 0 0 4px 0;">MÃ VÉ ĐIỆN TỬ</p>
            <p style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #be123c; margin: 0;">${payload.ticketCode}</p>
            <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Vui lòng xuất trình mã vé hoặc mã QR trên ứng dụng cho nhân viên soát vé tại rạp.</p>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          CineLight - Nâng tầm trải nghiệm điện ảnh Việt Nam
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"CineLight Cinema" <${process.env.SMTP_FROM || 'support@cinema.vn'}>`,
          to: payload.to,
          subject: `[CineLight] Xác nhận vé xem phim: ${payload.movieTitle} - Mã vé ${payload.ticketCode}`,
          html,
        });
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('Lỗi khi gửi email xác nhận vé:', error);
        return { success: false, error };
      }
    } else {
      // Mock / Dev environment fallback
      return {
        success: true,
        mocked: true,
        messageId: `mock-mail-${Date.now()}`,
      };
    }
  }
}

export const emailService = new EmailService();
