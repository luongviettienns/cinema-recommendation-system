import React from 'react';
import { Film, Calendar, Clock, MapPin, Tag } from 'lucide-react';
import { IMovie } from '../../types/movie';
import { IShowtime } from '../../types/showtime';
import { ISeat } from '../../types/seat';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate } from '../../utils/formatDate';
import { Badge } from '../../components/ui/Badge';

interface OrderSummaryCardProps {
  movie: IMovie;
  showtime: IShowtime;
  seats: ISeat[];
  totalAmount: number;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  movie,
  showtime,
  seats,
  totalAmount,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Film className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Thông Tin Đơn Hàng
          </h3>
        </div>

        {/* Movie Info */}
        <div className="flex items-start gap-4">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-16 h-24 object-cover rounded-xl border border-slate-100 shadow-xs shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {movie.ageRating}
              </Badge>
              <Badge variant="secondary" size="sm">
                {showtime.format}
              </Badge>
            </div>
            <h4 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">
              {movie.title}
            </h4>
            <p className="text-xs text-slate-400 font-medium">{movie.genre.join(', ')}</p>
          </div>
        </div>

        {/* Showtime Info */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong className="text-slate-800">{showtime.cinemaName}</strong> - {showtime.roomName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{formatFullDate(showtime.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-900">{showtime.time}</span>
          </div>
        </div>

        {/* Seat breakdown */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ghế đã chọn ({seats.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {seats.map((seat) => (
              <span
                key={seat.seatNumber}
                className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200"
              >
                {seat.seatNumber} ({seat.type.toUpperCase()})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Total */}
      <div className="border-t border-slate-100 pt-6 mt-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tiền vé ({seats.length} ghế)</span>
          <span className="font-medium text-slate-800">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Phí tiện ích / dịch vụ</span>
          <span className="font-medium text-emerald-600">Miễn phí</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-sm font-bold text-slate-900">Tổng thanh toán</span>
          <span className="text-2xl font-extrabold text-rose-600 tracking-tight">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
