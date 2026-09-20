import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Printer,
  CheckCircle2,
  Ticket,
  RotateCcw,
  AlertCircle,
  Clock3,
  X,
} from 'lucide-react';
import { IBooking } from '../../types/booking';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { refundService } from '../../services/refundService';

export const PerforatedTicket: React.FC<{
  booking: IBooking;
  onRefundRequested?: (bookingId: string, reason: string) => void;
}> = ({ booking, onRefundRequested }) => {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time diff calculation
  const showtimeDate = new Date(`${booking.showDate}T${booking.showTime}:00`);
  const diffMinutes = Math.floor((showtimeDate.getTime() - Date.now()) / (60 * 1000));

  const isPendingRefund = booking.status === 'REFUND_PENDING' || booking.refundStatus === 'PENDING';
  const isApprovedRefund = booking.status === 'CANCELLED' || booking.refundStatus === 'APPROVED';
  const isRejectedRefund = booking.refundStatus === 'REJECTED';
  const isPaid = (booking.paymentStatus === 'completed' || booking.status === 'PAID') && !isApprovedRefund;

  // CHỈ hiển thị khi: vé PAID, suất chiếu >= 60 phút, và chưa từng gửi yêu cầu (hoặc không đang pending/approved)
  const canRequestRefund = isPaid && !isPendingRefund && !isApprovedRefund && diffMinutes >= 60;

  const handleOpenRefundModal = () => {
    setRefundReason('');
    setIsRefundModalOpen(true);
  };

  const handleCloseRefundModal = () => {
    if (isSubmitting) return;
    setIsRefundModalOpen(false);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = refundReason.trim();
    if (reason.length < 5) {
      toast.error('Vui lòng nhập lý do hủy vé tối thiểu 5 ký tự.');
      return;
    }

    try {
      setIsSubmitting(true);
      await refundService.requestRefund(booking.id, reason);
      toast.success('Gửi yêu cầu hoàn tiền thành công!', {
        description: 'Ban Quản Lý rạp sẽ xét duyệt yêu cầu trong vòng 24 giờ.',
      });
      setIsRefundModalOpen(false);
      onRefundRequested?.(booking.id, reason);
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi yêu cầu hoàn tiền.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePrint = () => {
    toast.info('Đang mở hộp thoại in vé điện tử...', {
      description: 'Khuyến nghị chọn "Lưu dưới dạng PDF" hoặc in khổ dọc chuẩn.',
    });
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Printable Area */}
      <div
        id="printable-ticket"
        className="perforated-ticket bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden relative transition-all"
      >
        {/* Notches for perforated look */}
        <div className="perforated-left-notch shadow-inner" />
        <div className="perforated-right-notch shadow-inner" />
        <div className="perforated-divider" />

        {/* Top Header of Ticket */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">CineLight Cinema</p>
              <p className="text-[10px] text-rose-100 font-bold tracking-widest uppercase">E-Ticket Pass</p>
            </div>
          </div>
          <span className="text-xs font-mono font-black bg-white/20 px-3 py-1.5 rounded-lg tracking-wider border border-white/20">
            {booking.bookingCode}
          </span>
        </div>

        {/* Main Body (Movie details) */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <img
              src={booking.moviePoster}
              alt={booking.movieTitle}
              className="w-20 h-28 object-cover rounded-xl border border-slate-100 shadow-sm shrink-0"
            />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="primary" size="sm">
                  {booking.format}
                </Badge>
                {isPendingRefund && (
                  <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg font-bold border border-amber-200 inline-flex items-center gap-1">
                    <Clock3 className="w-3 h-3 text-amber-600" />
                    Chờ duyệt hoàn tiền
                  </span>
                )}
                {isApprovedRefund && (
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg font-bold border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã hoàn tiền
                  </span>
                )}
                {isRejectedRefund && (
                  <span className="text-[11px] text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg font-bold border border-rose-200 inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Từ chối hoàn tiền
                  </span>
                )}
                {!isPendingRefund && !isApprovedRefund && !isRejectedRefund && (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg font-bold border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã thanh toán
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug truncate">
                {booking.movieTitle}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{booking.cinemaName}</span>
              </p>
              <p className="text-xs font-bold text-slate-700">
                Phòng: <span className="text-rose-600">{booking.roomName}</span>
              </p>
            </div>
          </div>

          {/* Rejection Note if available */}
          {isRejectedRefund && booking.adminNote && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-rose-950">Phản hồi từ Ban Quản Lý:</span>
                <p className="mt-0.5 text-rose-800">{booking.adminNote}</p>
              </div>
            </div>
          )}

          {/* Grid Information */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Ngày chiếu:</span>
              <span className="font-extrabold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                {formatFullDate(booking.showDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Giờ chiếu:</span>
              <span className="font-extrabold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                {booking.showTime}
              </span>
            </div>
          </div>

          {/* Seats Info */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Chỗ ngồi (Ghế):</span>
              <span className="text-base font-black text-rose-600 tracking-wider">
                {booking.seats.join(', ')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Tổng tiền:</span>
              <span className="text-base font-black text-slate-900">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Lower Stub (Tear-off pass with QR Check-in) */}
        <div className="p-6 pt-8 bg-slate-50/40 flex flex-col items-center text-center space-y-3 border-t border-dashed border-slate-200">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80">
            <QRCodeSVG
              value={`CINELIGHT:${booking.bookingCode}:${booking.showtimeId}:${booking.seats.join(',')}`}
              size={124}
              level="H"
            />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800 tracking-widest font-mono uppercase">
              SCAN TO ENTER • {booking.bookingCode}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              Vui lòng xuất trình mã QR này tại cổng soát vé trước giờ chiếu ít nhất 10-15 phút.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="flex items-center gap-3 justify-center mt-6 no-print flex-wrap">
        <Button
          variant="outline"
          size="md"
          leftIcon={<Printer className="w-4 h-4" />}
          onClick={handlePrint}
          className="bg-white hover:bg-slate-50 border-slate-300 shadow-xs"
        >
          In Vé / Lưu PDF
        </Button>

        {canRequestRefund && (
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4 text-rose-600" />}
            onClick={handleOpenRefundModal}
            className="bg-white hover:bg-rose-50 border-rose-200 text-rose-600 shadow-xs hover:border-rose-300 transition-colors"
          >
            Yêu Cầu Hủy Vé
          </Button>
        )}
      </div>

      {/* Refund Request Confirmation Modal */}
      {isRefundModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCloseRefundModal();
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleCloseRefundModal}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 id="refund-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Yêu Cầu Hủy Vé & Hoàn Tiền
                </h3>
                <p className="text-xs text-slate-500 font-medium">Mã vé: {booking.bookingCode}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Phim:</span>
                  <span className="font-extrabold text-slate-900 truncate max-w-[200px]">{booking.movieTitle}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Suất chiếu:</span>
                  <span className="font-extrabold text-slate-900">{booking.showTime} - {formatFullDate(booking.showDate)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số tiền hoàn dự kiến:</span>
                  <span className="font-black text-sm text-rose-600">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Yêu cầu của bạn sẽ được gửi tới Ban Quản Lý rạp xét duyệt trong vòng 24 giờ. Vé sẽ tạm thời bị khóa cho đến khi có kết quả.
                </p>
              </div>

              <div>
                <label htmlFor="refund-reason" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do hủy vé <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="refund-reason"
                  rows={3}
                  required
                  autoFocus
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="VD: Tôi có việc bận đột xuất, đặt nhầm suất chiếu..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Tối thiểu 5 ký tự.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseRefundModal}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-200"
                >
                  Gửi Yêu Cầu Hoàn Tiền
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
