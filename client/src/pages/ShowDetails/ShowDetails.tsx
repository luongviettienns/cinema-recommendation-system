import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Clock, Calendar, Star, MapPin, ArrowLeft, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { IMovie } from '../../types/movie';
import { IShowtime } from '../../types/showtime';
import { movieService } from '../../services/movieService';
import { useBooking } from '../../context/BookingContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatDateLabel } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { TagBadgeWithTooltip } from '../../components/common/TagBadgeWithTooltip';
import { TagGlossaryModal } from '../../components/common/TagGlossaryModal';
import { HelpCircle } from 'lucide-react';
import { MovieReviews } from './MovieReviews';

export const ShowDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBookingShowtime } = useBooking();

  const [movie, setMovie] = useState<IMovie | null>(null);
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([movieService.getMovieById(id), movieService.getShowtimesByMovieId(id)]).then(
      ([movieData, showtimesData]) => {
        setMovie(movieData || null);
        setShowtimes(showtimesData);

        // Pick earliest date as default selectedDate
        if (showtimesData.length > 0) {
          const dates = Array.from(new Set(showtimesData.map((s) => s.date))).sort();
          setSelectedDate(dates[0]);
        }
        setIsLoading(false);
      }
    );
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin phim & suất chiếu...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto my-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy phim</h2>
        <p className="text-sm text-slate-500 mb-6">Phim này có thể đã ngừng chiếu hoặc liên kết không hợp lệ.</p>
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Về Trang Chủ
          </Button>
        </Link>
      </div>
    );
  }

  // Get distinct dates
  const availableDates = Array.from(new Set(showtimes.map((s) => s.date))).sort();

  // Filter showtimes for selected date
  const dateShowtimes = showtimes.filter((s) => s.date === selectedDate);

  // Group by roomName
  const groupedShowtimes = dateShowtimes.reduce((acc, st) => {
    const key = `${st.cinemaName} • ${st.roomName} (${st.format})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(st);
    return acc;
  }, {} as Record<string, IShowtime[]>);

  const handleSelectShowtime = (showtime: IShowtime) => {
    setBookingShowtime(showtime, movie);
    navigate(`/book/${showtime.id}`);
  };

  const getEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : url;
  };

  return (
    <motion.div
      className="space-y-12"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Back to Home Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách phim</span>
        </Link>
      </div>

      {/* Movie Info Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 lg:p-10">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/60 transition-colors flex items-center justify-center group"
                aria-label="Xem Trailer"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-transform">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-between">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <TagBadgeWithTooltip code={movie.ageRating} size="md" onOpenGlossary={() => setIsGlossaryOpen(true)} />
                {movie.formats.map((fmt) => (
                  <TagBadgeWithTooltip key={fmt} code={fmt} size="sm" onOpenGlossary={() => setIsGlossaryOpen(true)} />
                ))}
                <a
                  href="#reviews"
                  className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors"
                  title="Xem đánh giá từ khán giả"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{movie.rating}/10</span>
                </a>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{movie.duration} phút</span>
                </span>
              </div>

              {/* Titles */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                {movie.title}
              </h1>
              {movie.originalTitle && (
                <p className="text-sm font-semibold text-slate-400 mb-4">{movie.originalTitle}</p>
              )}

              {/* Description */}
              <div className="space-y-3 mb-6">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {movie.description}
                </p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    <strong className="text-slate-700">Đạo diễn:</strong> {movie.director}
                  </p>
                  <p>
                    <strong className="text-slate-700">Thể loại:</strong> {movie.genre.join(', ')}
                  </p>
                  <p>
                    <strong className="text-slate-700">Khởi chiếu:</strong> {movie.releaseDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Cast section */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Diễn viên chính
              </h3>
              <div className="flex flex-wrap gap-4">
                {movie.cast.map((actor) => (
                  <div key={actor.id} className="flex items-center gap-2.5">
                    <img
                      src={actor.avatar}
                      alt={actor.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{actor.name}</p>
                      <p className="text-[11px] text-slate-400">{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtime Booking Section */}
      <div id="showtimes" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-rose-600" />
              <span>Lịch Chiếu & Đặt Vé</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chọn ngày và khung giờ thuận tiện để bắt đầu chọn chỗ ngồi
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsGlossaryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition-colors w-fit cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-rose-600" />
            <span>Ký hiệu rạp & độ tuổi (?)</span>
          </button>
        </div>

        {/* Date Selector Tabs */}
        {availableDates.length > 0 ? (
          <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none">
            {availableDates.map((dateStr) => {
              const { dayOfWeek, formattedDate, isToday } = formatDateLabel(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[100px] sm:min-w-[115px] p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 scale-105'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isSelected ? 'text-rose-100' : isToday ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {dayOfWeek}
                  </span>
                  <span className="text-base font-extrabold tracking-tight">
                    {formattedDate}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Hiện tại chưa có suất chiếu cho phim này.</p>
        )}

        {/* Showtimes Grouped List */}
        <div className="space-y-4">
          {Object.keys(groupedShowtimes).length > 0 ? (
            Object.entries(groupedShowtimes).map(([groupTitle, list]) => (
              <div
                key={groupTitle}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">{groupTitle}</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {list.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleSelectShowtime(st)}
                      className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700 transition-all focus:outline-none"
                    >
                      <span className="text-base font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {st.time}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 group-hover:text-rose-500 mt-0.5">
                        Từ {formatCurrency(st.basePrice)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Không có suất chiếu nào trong ngày đã chọn. Vui lòng chọn ngày khác.
            </div>
          )}
        </div>
      </div>

      {/* Movie Reviews & Community Ratings Section */}
      <div id="reviews">
        <MovieReviews
          movieId={movie.id}
          movieTitle={movie.title}
          initialRating={movie.rating}
          onRatingUpdated={(newRating) => {
            setMovie((prev) => (prev ? { ...prev, rating: newRating } : prev));
          }}
        />
      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && (
        <Modal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          title={`Trailer: ${movie.title}`}
          maxWidth="4xl"
        >
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              src={getEmbedUrl(movie.trailerUrl)}
              title={movie.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </Modal>
      )}

      {/* Tag Glossary Modal */}
      <TagGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </motion.div>
  );
};
