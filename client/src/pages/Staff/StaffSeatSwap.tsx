import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  Film, 
  Clock, 
  MapPin, 
  Armchair, 
  Sparkles,
  Search,
  Printer
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface SwapRecord {
  ticketCode: string;
  movie: string;
  room: string;
  showtime: string;
  customerName: string;
  currentSeat: string;
  newSeat: string;
  reason: string;
  swappedAt: string;
}

export const StaffSeatSwap: React.FC = () => {
  const [ticketQuery, setTicketQuery] = useState('CL-839210');
  const [isSearching, setIsSearching] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<{
    code: string;
    movie: string;
    room: string;
    showtime: string;
    customer: string;
    seats: string[];
    price: string;
  } | null>({
    code: 'CL-839210',
    movie: 'Coyote vs. Acme',
    room: 'Phòng 01 - IMAX Laser',
    showtime: '19:30 (Hôm nay)',
    customer: 'Nguyễn Văn A (0987***321)',
    seats: ['E5', 'E6'],
    price: '190.000đ',
  });

  const [brokenSeat, setBrokenSeat] = useState('E5');
  const [targetSeat, setTargetSeat] = useState('E8');
  const [swapReason, setSwapReason] = useState('Ghế bị kẹt trục nghiêng');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccessPass, setSwapSuccessPass] = useState<SwapRecord | null>(null);

  // Available empty seats in this room
  const availableSeats = ['E7', 'E8', 'E9', 'F4', 'F5', 'F6', 'G7', 'G8'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setCurrentTicket({
        code: ticketQuery.trim().toUpperCase(),
        movie: 'Coyote vs. Acme',
        room: 'Phòng 01 - IMAX Laser',
        showtime: '19:30 (Hôm nay)',
        customer: 'Khách hàng quầy soát vé',
        seats: ['E5', 'E6'],
        price: '190.000đ',
      });
      setBrokenSeat('E5');
      setTargetSeat('E8');
      setSwapSuccessPass(null);
      toast.success(`Đã tìm thấy thông tin vé ${ticketQuery.toUpperCase()}`);
    }, 200);
  };

  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokenSeat) {
      toast.error('Vui lòng chọn ghế đang gặp sự cố');
      return;
    }
    if (!targetSeat) {
      toast.error('Vui lòng chọn ghế trống để đổi sang');
      return;
    }
    if (brokenSeat === targetSeat) {
      toast.error('Ghế mới không thể trùng với ghế sự cố');
      return;
    }

    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      const pass: SwapRecord = {
        ticketCode: currentTicket?.code || 'CL-839210',
        movie: currentTicket?.movie || 'Coyote vs. Acme',
        room: currentTicket?.room || 'Phòng 01 - IMAX Laser',
        showtime: currentTicket?.showtime || '19:30',
        customerName: currentTicket?.customer || 'Khách hàng',
        currentSeat: brokenSeat,
        newSeat: targetSeat,
        reason: swapReason,
        swappedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setSwapSuccessPass(pass);
      toast.success(`Đã đổi thành công từ ghế ${brokenSeat} sang ${targetSeat}!`);
    }, 300);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4">
      {/* Page Title & Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            Đổi Ghế Sự Cố Tại Chỗ
          </h1>
          <p className="text-xs text-slate-500">
            Xử lý nhanh ghế hỏng/trục trặc sát giờ chiếu (1-Chạm không qua online)
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-1 rounded-md border border-amber-200">
          Cấp tốc
        </span>
      </div>

      {/* Ticket Lookup Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2">
        <label className="block text-xs font-bold text-slate-700">
          Tra cứu mã vé / mã booking của khách
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ticketQuery}
              onChange={(e) => setTicketQuery(e.target.value)}
              placeholder="VD: CL-839210 hoặc BX-102938"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSearching}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Tìm vé
          </Button>
        </div>
      </form>

      {/* Ticket Details & Swap Section */}
      {currentTicket && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Ticket Header Summary */}
          <div className="bg-slate-50 border-b border-slate-200/80 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-xs text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                  {currentTicket.code}
                </span>
                <span className="text-xs font-bold text-slate-800">{currentTicket.movie}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {currentTicket.room} • Suất: <strong className="text-slate-700">{currentTicket.showtime}</strong>
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
              Đã thanh toán
            </span>
          </div>

          <form onSubmit={handleExecuteSwap} className="p-4 space-y-4">
            {/* Step 1: Select Seat with Issue */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                1. Ghế đang gặp sự cố cần đổi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentTicket.seats.map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => setBrokenSeat(seat)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      brokenSeat === seat
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Armchair className="w-4 h-4" />
                      Ghế {seat}
                    </span>
                    {brokenSeat === seat && <span className="text-[10px]">HỎNG ⚠️</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Replacement Available Seat */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                2. Chọn ghế TRỐNG thay thế trong phòng:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {availableSeats.map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => setTargetSeat(seat)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      targetSeat === seat
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    <span>{seat}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Chỉ hiển thị các ghế cùng hạng hoặc cao hơn chưa có người đặt trong suất chiếu.
              </p>
            </div>

            {/* Step 3: Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                3. Lý do sự cố:
              </label>
              <select
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Ghế bị kẹt trục nghiêng">Ghế bị kẹt trục nghiêng / hỏng đệm</option>
                <option value="Khách làm đổ nước lên ghế">Khách trước làm đổ nước bẩn lên nệm</option>
                <option value="Trục trặc màn hình/âm thanh góc khuất">Góc nhìn bị che khuất hoặc lỗi âm thanh</option>
                <option value="Khách đi cùng muốn ngồi gần người thân">Khách yêu cầu ngồi gần người thân</option>
                <option value="Lý do kỹ thuật khác">Lý do kỹ thuật khác</option>
              </select>
            </div>

            {/* Swap Visual Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between text-xs">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ghế cũ</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-sm">
                  {brokenSeat}
                </span>
              </div>
              <ArrowLeftRight className="w-5 h-5 text-emerald-600 animate-pulse" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ghế mới</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-sm">
                  {targetSeat}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSwapping}
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 rounded-xl shadow-md shadow-emerald-200 cursor-pointer"
            >
              🔄 Xác Nhận Đổi Ghế Tức Thì
            </Button>
          </form>
        </div>
      )}

      {/* Success Swap Pass (Phiếu Đổi Ghế Cầm Tay) */}
      {swapSuccessPass && (
        <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-400 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-emerald-800">
            <div className="flex items-center gap-1.5 font-black text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              THẺ ĐỔI GHẾ TẠI CHỖ (SEAT PASS)
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
              HỢP LỆ
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Mã vé gốc:</span>
              <span className="font-mono font-bold text-slate-800">{swapSuccessPass.ticketCode}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Phim:</span>
              <span className="font-bold text-slate-800">{swapSuccessPass.movie}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Phòng chiếu:</span>
              <span className="font-semibold text-slate-800">{swapSuccessPass.room}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Chuyển đổi:</span>
              <span className="font-bold text-emerald-700">
                Ghế {swapSuccessPass.currentSeat} ➔ Ghế {swapSuccessPass.newSeat}
              </span>
            </div>
            <div className="flex justify-between pt-0.5 text-[11px]">
              <span className="text-slate-400">Giờ xử lý:</span>
              <span className="text-slate-600">{swapSuccessPass.swappedAt}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success('Đang gửi lệnh in Thẻ đổi ghế ra máy in nhiệt quầy...');
                window.print?.();
              }}
              className="flex-1 justify-center bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              In Thẻ Đổi Ghế
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setSwapSuccessPass(null)}
              className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              Hoàn Tất
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
