import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Film, MapPin, Sparkles, ChevronRight, HelpCircle,
  Clock, Filter, Layers, ArrowRight
} from 'lucide-react';
import { IMovie } from '../../types/movie';
import { IShowtime } from '../../types/showtime';
import { ICinema } from '../../types/cinema';
import { movieService } from '../../services/movieService';
import { cinemaService } from '../../services/cinemaService';
import { mockStorage } from '../../services/mockStorage';
import { useBooking } from '../../context/BookingContext';
import { TagBadgeWithTooltip } from '../../components/common/TagBadgeWithTooltip';
import { TagGlossaryModal } from '../../components/common/TagGlossaryModal';
import { formatCurrency } from '../../utils/formatCurrency';

export const MovieSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { setBookingShowtime } = useBooking();

  const [movies, setMovies] = useState<IMovie[]>([]);
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCinema, setSelectedCinema] = useState<string>('Tất cả cụm rạp');
  const [selectedFormat, setSelectedFormat] = useState<string>('Tất cả định dạng');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      movieService.getAllMovies(),
      cinemaService.getAllCinemas(),
    ]).then(([moviesData, cinemasData]) => {
      setMovies(moviesData);
      setCinemas(cinemasData);

      // Load showtimes from storage
      const storageShowtimes: IShowtime[] = mockStorage.getShowtimes();
      setShowtimes(storageShowtimes);

      // Default date to today (local date string)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setSelectedDate(today);
      setIsLoading(false);
    });
  }, []);

  // 7 Upcoming Days
  const next7Days = useMemo(() => {
    const days: { dateStr: string; label: string; dayName: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let dayName = `T${d.getDay() + 1}`;
      if (d.getDay() === 0) dayName = 'CN';
      if (i === 0) dayName = 'Hôm Nay';
      if (i === 1) dayName = 'Ngày Mai';

      days.push({
        dateStr,
        label: `${day}/${month}`,
        dayName,
      });
    }
    return days;
  }, []);

  // Filtered Showtimes based on date, cinema, format
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((st) => {
      // Date filter
      if (selectedDate && st.date !== selectedDate) return false;

      // Cinema filter
      if (selectedCinema !== 'Tất cả cụm rạp' && st.cinemaName !== selectedCinema) return false;

      // Format filter
      if (selectedFormat !== 'Tất cả định dạng' && st.format !== selectedFormat) return false;

      return true;
    });
  }, [showtimes, selectedDate, selectedCinema, selectedFormat]);

  // Group showtimes by movie, then by (format + language)
  const groupedSchedule = useMemo(() => {
    // Map movieId -> { movie, formatGroups: Map<formatKey, showtimes[]> }
    const movieMap = new Map<string, {
      movie: IMovie;
      formatGroups: Map<string, { format: string; language: string; list: IShowtime[] }>;
    }>();

    filteredShowtimes.forEach((st) => {
      const movie = movies.find((m) => m.id === st.movieId);
      if (!movie) return;

      if (!movieMap.has(movie.id)) {
        movieMap.set(movie.id, {
          movie,
          formatGroups: new Map(),
        });
      }

      const formatKey = `${st.format} • ${st.language}`;
      const mEntry = movieMap.get(movie.id)!;
      if (!mEntry.formatGroups.has(formatKey)) {
        mEntry.formatGroups.set(formatKey, {
          format: st.format,
          language: st.language,
          list: [],
        });
      }

      mEntry.formatGroups.get(formatKey)!.list.push(st);
    });

    // Convert to structured array
    return Array.from(movieMap.values()).map((item) => ({
      movie: item.movie,
      subGroups: Array.from(item.formatGroups.values()).map((fg) => ({
        formatKey: `${fg.format} | ${fg.language}`,
        format: fg.format,
        language: fg.language,
        showtimes: fg.list.sort((a, b) => a.time.localeCompare(b.time)),
      })),
    }));
  }, [filteredShowtimes, movies]);

  // Mock total/available seats generator for demo
  const getSeatStats = (showtimeId: string) => {
    // Deterministic seat count based on id string
    let hash = 0;
    for (let i = 0; i < showtimeId.length; i++) {
      hash = (hash << 5) - hash + showtimeId.charCodeAt(i);
    }
    const total = 80 + (Math.abs(hash) % 4) * 20; // 80, 100, 120, 140
    const booked = Math.abs(hash) % Math.floor(total * 0.4);
    const available = total - booked;
    return { available, total };
  };

  const handleSelectSlot = (st: IShowtime, movie: IMovie) => {
    setBookingShowtime(st, movie);
    navigate(`/book/${st.id}`);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị bảng ma trận suất chiếu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-rose-600 text-xs font-black tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Lịch Chiếu Phim Chi Tiết
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-rose-600" />
            <span>Suất Chiếu Toàn Hệ Thống CineLight</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng quan tất cả các phim và khung giờ chiếu trải dài từ sáng đến tối
          </p>
        </div>

        {/* Tag Glossary Helper Trigger */}
        <button
          type="button"
          onClick={() => setIsGlossaryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer w-fit shadow-xs"
        >
          <HelpCircle className="w-4 h-4 text-rose-600" />
          <span>Giải Thích Ký Hiệu & Tag Rạp (?)</span>
        </button>
      </div>

      {/* Multi-tier Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Row 1: 7-Day Date Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {next7Days.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200 scale-105'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className={`text-[10px] font-extrabold uppercase ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                  {day.dayName}
                </span>
                <span className="text-sm font-black mt-0.5">{day.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Cinema & Format Dropdowns */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Cinema Dropdown */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
              >
                <option value="Tất cả cụm rạp">Tất cả cụm rạp ({cinemas.length})</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Dropdown */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
              >
                <option value="Tất cả định dạng">Tất cả định dạng</option>
                <option value="2D">2D Tiêu Chuẩn</option>
                <option value="3D">3D RealD</option>
                <option value="IMAX">IMAX Laser 4K</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Tìm thấy <strong className="text-rose-600 font-black">{groupedSchedule.length}</strong> phim có suất chiếu
          </div>
        </div>
      </div>

      {/* Movie Schedule Matrix List */}
      {groupedSchedule.length > 0 ? (
        <div className="space-y-6">
          {groupedSchedule.map(({ movie, subGroups }) => (
            <div
              key={movie.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column: Movie Poster */}
                <div className="shrink-0">
                  <Link
                    to={`/movie/${movie.id}`}
                    className="block w-24 sm:w-28 aspect-[2/3] rounded-2xl overflow-hidden shadow-sm group relative"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:opacity-0 transition-opacity" />
                  </Link>
                </div>

                {/* Right Column: Movie Header & Showtime Grid */}
                <div className="flex-1 min-w-0">
                  {/* Movie Title & Age Badge */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <TagBadgeWithTooltip
                      code={movie.ageRating}
                      size="md"
                      onOpenGlossary={() => setIsGlossaryOpen(true)}
                    />
                    <Link
                      to={`/movie/${movie.id}`}
                      className="group/title inline-flex items-center gap-1.5 text-lg sm:text-xl font-black text-slate-900 hover:text-rose-600 transition-colors uppercase tracking-tight"
                    >
                      <span>{movie.title}</span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover/title:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {/* Sub Details */}
                  <p className="text-xs text-slate-500 font-medium mb-4">
                    {movie.genre.map((g) => g.replace(/^Phim\s+/i, '')).join(', ')} • {movie.duration} phút • Đạo diễn: {movie.director}
                  </p>

                  {/* Format Subgroups & Showtime Grid */}
                  <div className="space-y-5">
                    {subGroups.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-2.5">
                        {/* Format & Language Subheader (e.g. 2D | Phụ đề tiếng Anh) */}
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-black text-slate-900">
                            {group.format}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">{group.language}</span>
                        </div>

                        {/* 3-Tier Grid Matrix Slots (Screen Room • Time • Available Seats) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                          {group.showtimes.map((st) => {
                            const { available, total } = getSeatStats(st.id);
                            const isLowStock = available < 15;
                            const isSoldOut = available === 0;

                            return (
                              <button
                                key={st.id}
                                disabled={isSoldOut}
                                onClick={() => handleSelectSlot(st, movie)}
                                className={`group/slot p-2.5 rounded-xl border text-center transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
                                  isSoldOut
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                                    : isLowStock
                                    ? 'bg-amber-50/70 hover:bg-rose-50 border-amber-200 hover:border-rose-400'
                                    : 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-300'
                                }`}
                              >
                                {/* Tier 1: Screen / Room Name */}
                                <span className="text-[10px] font-semibold text-slate-400 group-hover/slot:text-slate-600 truncate block">
                                  {st.roomName.split(' - ')[0] || st.roomName}
                                </span>

                                {/* Tier 2: Showtime Large & Bold */}
                                <span className="text-base sm:text-lg font-black text-slate-900 group-hover/slot:text-rose-600 transition-colors my-0.5 block">
                                  {st.time}
                                </span>

                                {/* Tier 3: Available Seats Ratio */}
                                <span className={`text-[10px] font-bold block ${
                                  isSoldOut
                                    ? 'text-slate-400'
                                    : isLowStock
                                    ? 'text-amber-700'
                                    : 'text-slate-500 group-hover/slot:text-rose-600'
                                }`}>
                                  {isSoldOut ? 'Hết vé' : `${available} / ${total} Ghế`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <Film className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy suất chiếu phù hợp</h3>
          <p className="text-xs text-slate-500 mb-5">
            Không có suất chiếu nào phù hợp với các bộ lọc đã chọn. Hãy thử chọn ngày khác hoặc chọn tất cả cụm rạp.
          </p>
          <button
            onClick={() => {
              setSelectedCinema('Tất cả cụm rạp');
              setSelectedFormat('Tất cả định dạng');
              setSelectedDate(next7Days[0].dateStr);
            }}
            className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors"
          >
            Đặt Lại Bộ Lọc
          </button>
        </div>
      )}

      {/* Tag Glossary Modal */}
      <TagGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
};
