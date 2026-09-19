import React, { useState, useId, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { OrderSummaryCard } from './OrderSummaryCard';
import { VietQRPayment } from './VietQRPayment';
import { CountdownTimer } from './CountdownTimer';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedMovie, selectedShowtime, selectedSeats, totalPrice, clearBooking } = useBooking();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate a stable booking code for this checkout session
  const bookingCode = useMemo(() => {
    return `CL-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  // Redirect if accessed directly with no seats selected
  if (!selectedMovie || !selectedShowtime || selectedSeats.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto my-12 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Chưa có thông tin đặt vé</h2>
        <p className="text-xs text-slate-500 mb-6">
          Bạn chưa chọn ghế hoặc phiên đặt vé đã kết thúc. Vui lòng chọn phim và suất chiếu trước.
        </p>
        <Link to="/">
          <Button variant="primary" size="md">
            Khám Phá Phim Ngay
          </Button>
        </Link>
      </div>
    );
  }

  const handleConfirmPaid = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const booking = await bookingService.createBooking({
        userId: user?.id || 'guest-user',
        showtimeId: selectedShowtime.id,
        seats: selectedSeats.map((s) => s.seatNumber),
        totalAmount: totalPrice,
        paymentMethod: 'vietqr',
      });

      // Fire confetti celebration effect
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Thanh toán thành công!', {
        description: `Mã đặt vé của bạn là ${booking.bookingCode}. Đang chuyển đến vé điện tử...`,
      });

      clearBooking();
      navigate(`/receipts?bookingId=${booking.id}`);
    } catch (err: any) {
      const msg = err.message || 'Thanh toán thất bại, vui lòng thử lại';
      setErrorMessage(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    setIsExpired(true);
    toast.error('Đã hết thời gian giữ ghế 7 phút!', {
      description: 'Ghế đã được hoàn trả lại sơ đồ phòng chiếu.',
    });
  };

  if (isExpired) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-red-200 p-8 max-w-md mx-auto my-12 shadow-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Đã hết thời gian giữ ghế</h2>
        <p className="text-xs text-slate-500 mb-6">
          Rất tiếc, thời gian giữ chỗ 7 phút đã hết hạn. Ghế đã được hoàn trả lại sơ đồ phòng chiếu để những khán giả khác có thể chọn.
        </p>
        <Link to={`/book/${selectedShowtime.id}`}>
          <Button variant="primary" size="md">
            Chọn Lại Ghế Ngồi
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back Link & Security Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={`/book/${selectedShowtime.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại chọn ghế</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 font-semibold w-fit">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cổng thanh toán mã hóa an toàn 256-bit</span>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 text-sm font-bold ml-4">✕</button>
        </div>
      )}

      {/* Countdown Timer Header Bar */}
      <div className="flex items-center justify-center">
        <CountdownTimer initialSeconds={420} onExpire={handleTimerExpire} />
      </div>

      {/* Main Grid: Summary Card (Left) + VietQR Payment (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5">
          <OrderSummaryCard
            movie={selectedMovie}
            showtime={selectedShowtime}
            seats={selectedSeats}
            totalAmount={totalPrice}
          />
        </div>

        <div className="lg:col-span-7">
          <VietQRPayment
            amount={totalPrice}
            bookingCode={bookingCode}
            onConfirmPaid={handleConfirmPaid}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};
