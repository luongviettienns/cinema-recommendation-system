import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Film, Calendar, Clock, MapPin, Printer, CheckCircle2, Ticket } from 'lucide-react';
import { IBooking } from '../../types/booking';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const PerforatedTicket: React.FC<{ booking: IBooking }> = ({ booking }) => {
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
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đã thanh toán
                </span>
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
      <div className="flex items-center gap-3 justify-center mt-6 no-print">
        <Button
          variant="outline"
          size="md"
          leftIcon={<Printer className="w-4 h-4" />}
          onClick={handlePrint}
          className="bg-white hover:bg-slate-50 border-slate-300 shadow-xs"
        >
          In Vé / Lưu PDF
        </Button>
      </div>
    </motion.div>
  );
};
