import React, { useState } from 'react';
import { 
  Ticket, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Printer, 
  Film, 
  Clock, 
  MapPin, 
  UserCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export const StaffBoxOffice: React.FC = () => {
  const [selectedMovie, setSelectedMovie] = useState('Coyote vs. Acme');
  const [selectedShowtime, setSelectedShowtime] = useState('19:30');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['E5', 'E6']);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState<any | null>(null);

  const movies = [
    { title: 'Coyote vs. Acme', duration: '103p', room: 'Phòng 01 - IMAX' },
    { title: 'Bầy Xác Sống', duration: '125p', room: 'Phòng 02 - Dolby' },
    { title: 'Ngày Tàn Của Phố Oak', duration: '112p', room: 'Phòng 03 - 2D' },
  ];

  const showtimes = ['17:30', '19:30', '21:15', '22:45'];

  const handleSeatClick = (seat: string) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      if (selectedSeats.length >= 8) {
        toast.warning('Tối đa 8 vé cho 1 lần bán tại quầy');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.length * 95000;
  };

  const handleSellTickets = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ghế để bán');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const bookingCode = `BX-${Math.floor(100000 + Math.random() * 900000)}`;
      setIssuedTicket({
        bookingCode,
        movie: selectedMovie,
        showtime: selectedShowtime,
        room: 'Phòng 01 - IMAX Laser',
        seats: selectedSeats.join(', '),
        totalAmount: calculateTotal(),
        paymentMethod: paymentMethod === 'CASH' ? 'Tiền Mặt (Cash)' : 'Quẹt Thẻ (POS)',
        issuedAt: new Date().toLocaleTimeString('vi-VN'),
      });
      toast.success(`Đã xuất vé thành công mã [${bookingCode}]!`);
    }, 400);
  };

  const handleReset = () => {
    setIssuedTicket(null);
    setSelectedSeats([]);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-600" />
            <span>Bán Vé Tại Quầy (Walk-in Box Office)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bán trực tiếp cho khách mua tại rạp • Thu tiền mặt/POS • Không qua giữ chỗ 7 phút
          </p>
        </div>
      </div>

      {!issuedTicket ? (
        <form onSubmit={handleSellTickets} className="space-y-4">
          {/* Step 1: Movie Selection */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              1. Chọn Phim Chiếu Hôm Nay
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {movies.map((m) => (
                <button
                  type="button"
                  key={m.title}
                  onClick={() => setSelectedMovie(m.title)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedMovie === m.title
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{m.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.duration} • {m.room}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Showtime Selection */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              2. Chọn Suất Chiếu
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {showtimes.map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setSelectedShowtime(st)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedShowtime === st
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Quick Seat Selection (Interactive Matrix) */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                3. Chọn Ghế Nhanh ({selectedSeats.length} ghế)
              </label>
              <span className="text-[11px] font-bold text-rose-600">
                {calculateTotal().toLocaleString('vi-VN')} đ
              </span>
            </div>

            {/* Screen indicator */}
            <div className="w-full h-1.5 bg-slate-300 rounded-full my-2 text-center" />

            {/* Simplified Seat Grid */}
            <div className="grid grid-cols-8 gap-1.5 max-w-sm mx-auto py-2">
              {['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'].map((seat) => {
                const isSelected = selectedSeats.includes(seat);
                const isOccupied = seat === 'D1' || seat === 'F8';
                return (
                  <button
                    type="button"
                    key={seat}
                    disabled={isOccupied}
                    onClick={() => handleSeatClick(seat)}
                    className={`h-9 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isOccupied
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-600 text-white font-black scale-105 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                    }`}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Payment Method */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              4. Phương Thức Thu Tiền Tại Quầy
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold">Tiền Mặt (Cash)</p>
                  <p className="text-[10px] text-slate-500">Khách trả tiền mặt</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('POS')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  paymentMethod === 'POS'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold">Quẹt Thẻ (POS)</p>
                  <p className="text-[10px] text-slate-500">Cổng POS tại quầy</p>
                </div>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-emerald-900/30 cursor-pointer"
            isLoading={isProcessing}
          >
            Thu {calculateTotal().toLocaleString('vi-VN')} đ & Xuất Vé Ngay
          </Button>
        </form>
      ) : (
        /* Issued Ticket Confirmation Screen */
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-xl space-y-6 text-center animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">Bán Vé & Thu Tiền Thành Công!</h2>
            <p className="text-xs text-slate-500">Vé đã được phát hành và ghi nhận vào hệ thống</p>
          </div>

          {/* Printable Ticket Voucher */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left font-mono space-y-2 text-xs">
            <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
              CINELIGHT CINEMA BOX OFFICE
            </div>
            <div className="flex justify-between">
              <span>MÃ ĐẶT VÉ:</span>
              <strong className="text-slate-900">{issuedTicket.bookingCode}</strong>
            </div>
            <div className="flex justify-between">
              <span>PHIM:</span>
              <strong>{issuedTicket.movie}</strong>
            </div>
            <div className="flex justify-between">
              <span>SUẤT CHIẾU:</span>
              <span>{issuedTicket.showtime}</span>
            </div>
            <div className="flex justify-between">
              <span>PHÒNG / GHẾ:</span>
              <strong className="text-rose-600">{issuedTicket.seats}</strong>
            </div>
            <div className="flex justify-between">
              <span>HÌNH THỨC:</span>
              <span>{issuedTicket.paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-dashed border-slate-300 font-sans font-black text-sm">
              <span>TỔNG TIỀN:</span>
              <span className="text-emerald-700">{issuedTicket.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => toast.info('Đang gửi lệnh in tới máy in nhiệt tại quầy...')}
              className="justify-center border-slate-300 font-bold"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              In Vé Giấy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleReset}
              className="justify-center bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              Bán Đơn Tiếp Theo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
