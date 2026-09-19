import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, MapPin, Film } from 'lucide-react';
import { ISeat } from '../../types/seat';
import { IShowtime } from '../../types/showtime';
import { IMovie } from '../../types/movie';
import { bookingService } from '../../services/bookingService';
import { movieService } from '../../services/movieService';
import { useBooking } from '../../context/BookingContext';
import { CurvedScreen } from './CurvedScreen';
import { SeatGrid } from './SeatGrid';
import { SeatLegend } from './SeatLegend';
import { FloatingSummaryBar } from './FloatingSummaryBar';
import { formatFullDate } from '../../utils/formatDate';

export const BookSeats: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const {
    selectedShowtime,
    selectedMovie,
    selectedSeats,
    totalPrice,
    setBookingShowtime,
    toggleSeat,
  } = useBooking();

  const [seats, setSeats] = useState<ISeat[]>([]);
  const [currentShowtime, setCurrentShowtime] = useState<IShowtime | null>(selectedShowtime);
  const [currentMovie, setCurrentMovie] = useState<IMovie | null>(selectedMovie);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!showtimeId) return;
    setIsLoading(true);

    const loadData = async () => {
      try {
        let st = selectedShowtime;
        let mv = selectedMovie;

        // Recover from service if refreshed page
        if (!st || st.id !== showtimeId) {
          st = (await movieService.getShowtimeById(showtimeId)) || null;
          if (st) {
            mv = (await movieService.getMovieById(st.movieId)) || null;
            if (mv) setBookingShowtime(st, mv);
          }
        }

        if (!st || !mv) {
          setError('Không tìm thấy thông tin suất chiếu.');
          setIsLoading(false);
          return;
        }

        setCurrentShowtime(st);
        setCurrentMovie(mv);

        const loadedSeats = await bookingService.getSeatsByShowtime(showtimeId, st.basePrice);
        setSeats(loadedSeats);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Lỗi tải danh sách ghế');
        setIsLoading(false);
      }
    };

    loadData();
  }, [showtimeId]);

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) return;
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị sơ đồ phòng chiếu...</p>
      </div>
    );
  }

  if (error || !currentShowtime || !currentMovie) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto my-12">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{error || 'Có lỗi xảy ra'}</h2>
        <p className="text-sm text-slate-500 mb-6">Vui lòng quay lại danh sách suất chiếu để chọn lại.</p>
        <Link to="/">
          <button className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">
            Về Trang Chủ
          </button>
        </Link>
      </div>
    );
  }

  const selectedSeatNumbers = selectedSeats.map((s) => s.seatNumber);

  return (
    <div className="space-y-6 pb-28">
      {/* Back Link */}
      <div>
        <Link
          to={`/movie/${currentMovie.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Đổi suất chiếu khác</span>
        </Link>
      </div>

      {/* Showtime Information Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentMovie.poster}
            alt={currentMovie.title}
            className="w-14 h-20 rounded-xl object-cover border border-slate-100 shadow-xs shrink-0"
          />
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span>{currentShowtime.format} • {currentShowtime.language}</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentMovie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {currentShowtime.cinemaName} - {currentShowtime.roomName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatFullDate(currentShowtime.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {currentShowtime.time}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen & Seat Grid Area */}
      <div className="bg-slate-100/60 rounded-3xl border border-slate-200/60 p-4 sm:p-8">
        <CurvedScreen
          roomName={currentShowtime.roomName}
          format={currentShowtime.format}
          selectedSeatsCount={selectedSeatNumbers.length}
          selectedSeatNames={selectedSeatNumbers}
        />
        <SeatGrid
          seats={seats}
          selectedSeatNumbers={selectedSeatNumbers}
          onToggleSeat={toggleSeat}
        />
        <SeatLegend />
      </div>

      {/* Floating Bottom Action Bar */}
      <FloatingSummaryBar
        selectedSeatNumbers={selectedSeatNumbers}
        totalPrice={totalPrice}
        onProceed={handleProceedToCheckout}
      />
    </div>
  );
};
