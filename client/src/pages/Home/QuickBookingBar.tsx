import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, MapPin, Calendar, Clock, Ticket, Sparkles } from 'lucide-react';
import { IMovie } from '../../types/movie';
import { IShowtime } from '../../types/showtime';
import { movieService } from '../../services/movieService';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export const QuickBookingBar: React.FC<{ movies: IMovie[] }> = ({ movies }) => {
  const navigate = useNavigate();
  const nowShowingMovies = movies.filter((m) => m.isNowShowing);

  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [isLoadingShows, setIsLoadingShows] = useState(false);

  // Set default movie
  useEffect(() => {
    if (nowShowingMovies.length > 0 && !selectedMovieId) {
      setSelectedMovieId(nowShowingMovies[0].id);
    }
  }, [nowShowingMovies, selectedMovieId]);

  // Fetch showtimes when selected movie changes
  useEffect(() => {
    if (!selectedMovieId) return;

    setIsLoadingShows(true);
    movieService
      .getShowtimesByMovieId(selectedMovieId)
      .then((data) => {
        setShowtimes(data);
        if (data.length > 0) {
          setSelectedCinema(data[0].cinemaName);
          setSelectedDate(data[0].date);
          setSelectedShowId(data[0].id);
        } else {
          setSelectedCinema('');
          setSelectedDate('');
          setSelectedShowId('');
        }
      })
      .finally(() => setIsLoadingShows(false));
  }, [selectedMovieId]);

  // Unique cinemas for this movie
  const cinemas = Array.from(new Set(showtimes.map((s) => s.cinemaName)));

  // Unique dates for this movie & cinema
  const availableDates = Array.from(
    new Set(
      showtimes
        .filter((s) => !selectedCinema || s.cinemaName === selectedCinema)
        .map((s) => s.date)
    )
  );

  // Matching showtimes
  const matchingShows = showtimes.filter(
    (s) =>
      (!selectedCinema || s.cinemaName === selectedCinema) &&
      (!selectedDate || s.date === selectedDate)
  );

  const handleBooking = () => {
    if (!selectedShowId) {
      toast.warning('Vui lòng chọn đầy đủ suất chiếu để tiếp tục đặt vé!');
      return;
    }
    navigate(`/book/${selectedShowId}`);
  };

  if (nowShowingMovies.length === 0) return null;

  return (
    <div className="relative z-10 w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-3xl p-5 sm:p-6 mb-12 transition-all">
      {/* Header Dock Label */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Đặt Vé Nhanh Tiện Lợi
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 hidden sm:inline-block">
                4 Bước Siêu Tốc
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Chọn nhanh phim, rạp, ngày và giờ chiếu yêu thích chỉ trong vài giây
            </p>
          </div>
        </div>
      </div>

      {/* 5-Column Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
        {/* Step 1: Movie */}
        <div className="lg:col-span-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-rose-500" />
            <span>1. Chọn Phim</span>
          </label>
          <div className="relative">
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all truncate cursor-pointer"
            >
              {nowShowingMovies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Cinema */}
        <div className="lg:col-span-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>2. Chọn Rạp</span>
          </label>
          <div className="relative">
            <select
              value={selectedCinema}
              onChange={(e) => setSelectedCinema(e.target.value)}
              disabled={cinemas.length === 0 || isLoadingShows}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all truncate cursor-pointer disabled:opacity-50"
            >
              {cinemas.length > 0 ? (
                cinemas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              ) : (
                <option value="">Chưa có rạp chiếu</option>
              )}
            </select>
          </div>
        </div>

        {/* Step 3: Date */}
        <div className="lg:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>3. Ngày</span>
          </label>
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={availableDates.length === 0 || isLoadingShows}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all truncate cursor-pointer disabled:opacity-50"
            >
              {availableDates.length > 0 ? (
                availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))
              ) : (
                <option value="">Không có suất</option>
              )}
            </select>
          </div>
        </div>

        {/* Step 4: Time */}
        <div className="lg:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>4. Suất Chiếu</span>
          </label>
          <div className="relative">
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              disabled={matchingShows.length === 0 || isLoadingShows}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all truncate cursor-pointer disabled:opacity-50"
            >
              {matchingShows.length > 0 ? (
                matchingShows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.time} ({s.format} - {s.language})
                  </option>
                ))
              ) : (
                <option value="">Hết suất</option>
              )}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:col-span-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleBooking}
            disabled={!selectedShowId || isLoadingShows}
            className="w-full justify-center text-xs sm:text-sm font-extrabold py-2.5 rounded-2xl shadow-md shadow-rose-600/30 animate-shimmer"
            leftIcon={<Ticket className="w-4 h-4" />}
          >
            Mua Vé Nhanh
          </Button>
        </div>
      </div>
    </div>
  );
};
