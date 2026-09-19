import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ISeat } from '../../types/seat';

interface SeatGridProps {
  seats: ISeat[];
  selectedSeatNumbers: string[];
  onToggleSeat: (seat: ISeat) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  selectedSeatNumbers,
  onToggleSeat,
}) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const handleSeatClick = (seat: ISeat) => {
    if (seat.isBooked) {
      toast.error(`Ghế ${seat.seatNumber} đã có người đặt trước! Vui lòng chọn ghế trống khác.`);
      return;
    }

    const isCurrentlySelected = selectedSeatNumbers.includes(seat.seatNumber);
    if (!isCurrentlySelected && selectedSeatNumbers.length >= 8) {
      toast.warning('Mỗi đơn đặt vé chỉ được chọn tối đa 8 ghế!');
      return;
    }

    onToggleSeat(seat);
  };

  return (
    <div className="w-full max-w-3xl mx-auto overflow-x-auto pb-4 scrollbar-none">
      <div className="min-w-[580px] flex flex-col gap-2.5 items-center justify-center p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs">
        {rows.map((row) => {
          const rowSeats = seats.filter((s) => s.row === row).sort((a, b) => a.col - b.col);

          return (
            <div key={row} className="flex items-center gap-2">
              {/* Row Label Left with Golden Spot indicator */}
              <div className="w-7 flex items-center justify-end gap-1">
                {['D', 'E', 'F'].includes(row) && (
                  <span className="text-[9px] text-amber-500 font-black select-none" title="Hàng ghế Trung Tâm - Góc Nhìn Vàng">★</span>
                )}
                <span className={`text-xs font-extrabold text-center select-none ${
                  ['D', 'E', 'F'].includes(row) ? 'text-amber-600 font-black' : 'text-slate-400'
                }`}>
                  {row}
                </span>
              </div>

              {/* Seats in Row */}
              <div className="flex items-center gap-2">
                {rowSeats.map((seat, idx) => {
                  const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
                  const isBooked = seat.isBooked;

                  // Add aisle margin between col 5 and 6
                  const hasAisle = idx === 4;

                  let styleClass =
                    'bg-slate-100 border-slate-300 text-slate-700 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600';

                  if (seat.type === 'vip') {
                    styleClass =
                      'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400 font-semibold';
                  } else if (seat.type === 'couple') {
                    styleClass =
                      'bg-pink-50/80 border-pink-300 text-pink-900 hover:bg-pink-100 hover:border-pink-400 font-semibold';
                  }

                  if (isSelected) {
                    styleClass =
                      'bg-rose-600 border-rose-600 text-white font-extrabold shadow-md shadow-rose-300 ring-2 ring-rose-400/50 z-10';
                  } else if (isBooked) {
                    styleClass =
                      'bg-slate-200 border-transparent text-slate-400 line-through cursor-not-allowed opacity-60';
                  }

                  return (
                    <React.Fragment key={seat.seatNumber}>
                      <motion.button
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleSeatClick(seat)}
                        whileHover={!isBooked ? { scale: 1.12 } : undefined}
                        whileTap={!isBooked ? { scale: 0.9 } : undefined}
                        animate={isSelected ? { scale: [1, 1.15, 1.08] } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-[11px] font-bold flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus:outline-none select-none cursor-pointer disabled:cursor-not-allowed ${styleClass}`}
                        title={`${seat.seatNumber} - ${seat.type.toUpperCase()} (${seat.price.toLocaleString('vi-VN')} đ)`}
                        aria-label={`Ghế ${seat.seatNumber} ${isSelected ? 'đã chọn' : isBooked ? 'đã bán' : 'trống'}`}
                      >
                        {seat.seatNumber}
                      </motion.button>

                      {/* Middle Aisle gap */}
                      {hasAisle && <div className="w-5 sm:w-6" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <div className="w-7 flex items-center justify-start gap-1">
                <span className={`text-xs font-extrabold text-center select-none ${
                  ['D', 'E', 'F'].includes(row) ? 'text-amber-600 font-black' : 'text-slate-400'
                }`}>
                  {row}
                </span>
                {['D', 'E', 'F'].includes(row) && (
                  <span className="text-[9px] text-amber-500 font-black select-none" title="Hàng ghế Trung Tâm - Góc Nhìn Vàng">★</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Auditorium Entrance / Exit orientation footer */}
        <div className="w-full max-w-lg pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            🚪 Cửa Vào Khán Phòng
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            ← Lối Đi Giữa Hai Dãy Ghế →
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            Cửa Thoát Hiểm 🚪
          </span>
        </div>
      </div>
    </div>
  );
};
