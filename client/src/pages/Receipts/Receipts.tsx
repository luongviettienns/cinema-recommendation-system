import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Ticket, ArrowLeft, CheckCircle2, History, Film } from 'lucide-react';
import { IBooking } from '../../types/booking';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { PerforatedTicket } from './PerforatedTicket';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate } from '../../utils/formatDate';

export const Receipts: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightBookingId = searchParams.get('bookingId');

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<IBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefundRequested = (bookingId: string, reason: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'REFUND_PENDING',
              refundStatus: 'PENDING',
              refundReason: reason,
            }
          : b,
      ),
    );
    setSelectedTicket((prev) =>
      prev && prev.id === bookingId
        ? {
            ...prev,
            status: 'REFUND_PENDING',
            refundStatus: 'PENDING',
            refundReason: reason,
          }
        : prev,
    );
  };

  useEffect(() => {
    bookingService.getUserBookings().then((data) => {
      setBookings(data);
      if (highlightBookingId) {
        const found = data.find((b) => b.id === highlightBookingId);
        if (found) setSelectedTicket(found);
        else if (data.length > 0) setSelectedTicket(data[0]);
      } else if (data.length > 0) {
        setSelectedTicket(data[0]);
      }
      setIsLoading(false);
    });
  }, [highlightBookingId, user?.id]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin vé...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Banner if coming from a successful checkout */}
      {highlightBookingId && selectedTicket?.id === highlightBookingId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-xs animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 tracking-tight">
              Đặt Vé & Thanh Toán Thành Công!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700 mt-1">
              Mã vé của bạn là <strong className="font-mono text-emerald-900">{selectedTicket.bookingCode}</strong>.
              Vé điện tử đã sẵn sàng để check-in tại rạp chiếu phim.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-rose-600" />
            <span>Vé Điện Tử & Lịch Sử Giao Dịch</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý vé đã đặt, xuất mã QR vào rạp và xem lại hóa đơn thanh toán
          </p>
        </div>

        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Tiếp Tục Đặt Vé Khác
          </Button>
        </Link>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active / Highlighted Ticket View (Left) */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <PerforatedTicket
                booking={selectedTicket}
                onRefundRequested={handleRefundRequested}
              />
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
                Chọn một vé bên danh sách để xem chi tiết
              </div>
            )}
          </div>

          {/* List of All Past Bookings (Right) */}
          <div className="lg:col-span-5 space-y-4 no-print">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lịch Sử Đặt Vé Của Bạn ({bookings.length})
              </h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {bookings.map((b) => {
                const isSelected = selectedTicket?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedTicket(b)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={b.moviePoster}
                        alt={b.movieTitle}
                        className="w-12 h-16 object-cover rounded-lg border border-slate-100 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {b.bookingCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                          {b.movieTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {formatFullDate(b.showDate)} • {b.showTime}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Ghế: <strong className="text-slate-700">{b.seats.join(', ')}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {formatCurrency(b.totalAmount)}
                      </span>
                      {b.status === 'REFUND_PENDING' || b.refundStatus === 'PENDING' ? (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block mt-1">
                          Chờ hoàn tiền
                        </span>
                      ) : b.status === 'CANCELLED' || b.refundStatus === 'APPROVED' ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-1">
                          Đã hoàn tiền
                        </span>
                      ) : b.refundStatus === 'REJECTED' ? (
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block mt-1">
                          Từ chối hoàn
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                          Thành công
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Bạn Chưa Có Vé Nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Hãy khám phá các siêu phẩm điện ảnh đang chiếu và đặt cho mình những vị trí ngồi đẹp nhất nhé!
          </p>
          <Link to="/" className="inline-block pt-2">
            <Button variant="primary" size="md">
              Khám Phá Phim Ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

