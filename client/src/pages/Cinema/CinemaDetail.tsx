import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Phone, Star, Clock, Calendar, Sparkles, Navigation, Copy,
  Check, Info, HelpCircle, Film, ShieldAlert, ArrowLeft, Armchair,
  Car, Bike, Compass, Ticket, ExternalLink
} from 'lucide-react';
import { ICinema } from '../../types/cinema';
import { IShowtime } from '../../types/showtime';
import { IMovie } from '../../types/movie';
import { cinemaService } from '../../services/cinemaService';
import { movieService } from '../../services/movieService';
import { mockStorage } from '../../services/mockStorage';
import { useBooking } from '../../context/BookingContext';
import { TagBadgeWithTooltip } from '../../components/common/TagBadgeWithTooltip';
import { TagGlossaryModal } from '../../components/common/TagGlossaryModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateLabel } from '../../utils/formatDate';
import { toast } from 'sonner';

export const CinemaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBookingShowtime } = useBooking();

  const [cinema, setCinema] = useState<ICinema | null>(null);
  const [allCinemas, setAllCinemas] = useState<ICinema[]>([]);
  const [allMovies, setAllMovies] = useState<IMovie[]>([]);
  const [allShowtimes, setAllShowtimes] = useState<IShowtime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'pricing' | 'directions' | 'amenities'>('schedule');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      cinemaService.getAllCinemas(),
      id ? cinemaService.getCinemaById(id) : Promise.resolve(null),
      movieService.getAllMovies(),
    ]).then(([cinemasData, cinemaData, moviesData]) => {
      setAllCinemas(cinemasData);
      setCinema(cinemaData || cinemasData[0] || null);
      setAllMovies(moviesData);

      // Load showtimes
      const storageShowtimes = mockStorage.getShowtimes();
      setAllShowtimes(storageShowtimes);

      // Default date
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      setIsLoading(false);
    });
  }, [id]);

  // Generate 7 upcoming days
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

  // Filter showtimes for this cinema and date
  const cinemaShowtimes = useMemo(() => {
    if (!cinema) return [];
    return allShowtimes.filter((st) => {
      const matchCinema = st.cinemaName.toLowerCase().includes(cinema.name.toLowerCase()) ||
        cinema.name.toLowerCase().includes(st.cinemaName.toLowerCase());
      const matchDate = !selectedDate || st.date === selectedDate;
      return matchCinema && matchDate;
    });
  }, [cinema, allShowtimes, selectedDate]);

  // Group showtimes by movie
  const showtimesByMovie = useMemo(() => {
    const map = new Map<string, { movie: IMovie; showtimes: IShowtime[] }>();
    cinemaShowtimes.forEach((st) => {
      const movie = allMovies.find((m) => m.id === st.movieId);
      if (movie) {
        if (!map.has(movie.id)) {
          map.set(movie.id, { movie, showtimes: [] });
        }
        map.get(movie.id)!.showtimes.push(st);
      }
    });
    return Array.from(map.values());
  }, [cinemaShowtimes, allMovies]);

  const handleCopyAddress = () => {
    if (!cinema) return;
    navigator.clipboard.writeText(cinema.address);
    setCopiedAddress(true);
    toast.success('Đã sao chép địa chỉ cụm rạp vào bộ nhớ tạm!');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSelectShowtime = (showtime: IShowtime, movie: IMovie) => {
    setBookingShowtime(showtime, movie);
    navigate(`/book/${showtime.id}`);
  };

  // Helper to calculate estimated end time (+15m buffer)
  const getEndTime = (startTime: string, durationMinutes: number): string => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + durationMinutes + 15;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin cụm rạp CineLight...</p>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto my-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy cụm rạp</h2>
        <p className="text-sm text-slate-500 mb-6">Cụm rạp bạn đang tìm kiếm không tồn tại hoặc đã ngừng hoạt động.</p>
        <Link to="/cinemas" className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs">
          Xem Danh Sách Cụm Rạp
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back Navigation & Cinema Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/cinemas"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tất Cả Cụm Rạp CineLight</span>
        </Link>

        {/* Quick Cinema Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Đổi rạp:</span>
          <select
            value={cinema.id}
            onChange={(e) => navigate(`/cinema/${e.target.value}`)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
          >
            {allCinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Cinema Showcase Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Cinema Image */}
          <div className="lg:col-span-5 relative h-64 lg:h-auto overflow-hidden bg-slate-100">
            <img
              src={cinema.imageUrl}
              alt={cinema.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-4 left-4 lg:hidden text-white">
              <span className="text-xs font-bold bg-rose-600 px-2.5 py-1 rounded-md">
                {cinema.region}
              </span>
            </div>
          </div>

          {/* Cinema Info & Actions */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="hidden lg:inline-block text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                  {cinema.region}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{cinema.rating}</span>
                  <span className="text-slate-400 font-normal">({cinema.reviewCount} đánh giá)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {cinema.name}
              </h1>

              {/* Address with Quick Copy */}
              <div className="flex items-start gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{cinema.address}</span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                  title="Sao chép địa chỉ"
                >
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Phòng chiếu</p>
                  <p className="text-sm font-black text-slate-900">{cinema.totalRooms} Phòng hiện đại</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Số chỗ ngồi</p>
                  <p className="text-sm font-black text-slate-900">{cinema.totalSeats.toLocaleString('vi-VN')} Ghế êm</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Hotline rạp</p>
                  <p className="text-sm font-black text-rose-600">{cinema.phone}</p>
                </div>
              </div>

              {/* Amenities Badges */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {cinema.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.name + ' ' + cinema.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Chỉ Đường Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>

              {/* Button to Open Tag Glossary Modal */}
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-rose-600" />
                <span>Giải Thích Ký Hiệu & Tag Rạp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Tabs Navigation Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-extrabold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Lịch Chiếu Phim</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-extrabold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>2. Bảng Giá Vé</span>
          </button>

          <button
            onClick={() => setActiveTab('directions')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-extrabold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'directions'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>3. Hướng Dẫn Đi Lại & Gửi Xe</span>
          </button>

          <button
            onClick={() => setActiveTab('amenities')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-extrabold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'amenities'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>4. Tiện Ích & Phòng Chiếu</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: LỊCH CHIẾU PHIM */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Date Selector Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {next7Days.map((day) => {
              const isSelected = selectedDate === day.dateStr;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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

          {/* Industry Rule Notice Banner */}
          <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Thời gian bắt đầu suất chiếu có thể chênh lệch 10–15 phút do chiếu trailer và quảng cáo rạp.</span>
            </span>
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="text-rose-600 font-bold hover:underline shrink-0 hidden sm:inline"
            >
              Xem chú giải Tag (?)
            </button>
          </div>

          {/* Showtimes by Movie List */}
          {showtimesByMovie.length > 0 ? (
            <div className="space-y-6">
              {showtimesByMovie.map(({ movie, showtimes }) => (
                <div
                  key={movie.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Movie Poster & Quick Details */}
                    <div className="flex items-start gap-4 md:w-72 shrink-0">
                      <Link to={`/movie/${movie.id}`} className="shrink-0 w-20 sm:w-24 aspect-[2/3] rounded-2xl overflow-hidden shadow-sm block group">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <TagBadgeWithTooltip code={movie.ageRating} size="sm" onOpenGlossary={() => setIsGlossaryOpen(true)} />
                          <span className="text-[11px] font-bold text-slate-400">
                            {movie.duration} phút
                          </span>
                        </div>
                        <Link to={`/movie/${movie.id}`}>
                          <h3 className="text-base font-extrabold text-slate-900 tracking-tight hover:text-rose-600 transition-colors line-clamp-2">
                            {movie.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {movie.genre.map((g) => g.replace(/^Phim\s+/i, '')).join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Showtimes Matrix */}
                    <div className="flex-1 pt-3 md:pt-0 md:pl-5 md:border-l md:border-slate-100 flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Chọn Khung Giờ Chiếu:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {showtimes.map((st) => {
                          const endTime = getEndTime(st.time, movie.duration);
                          return (
                            <button
                              key={st.id}
                              onClick={() => handleSelectShowtime(st, movie)}
                              className="group p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all text-left cursor-pointer shadow-xs"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                                  {st.time}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  ~ {endTime}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <TagBadgeWithTooltip code={st.format} size="sm" onOpenGlossary={() => setIsGlossaryOpen(true)} />
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {st.language}
                                </span>
                              </div>
                              <div className="mt-1.5 pt-1 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[10px]">
                                <span className="font-extrabold text-rose-600">
                                  {formatCurrency(st.basePrice)}
                                </span>
                                <span className="text-emerald-700 font-semibold">
                                  ● Còn ghế
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
              <Film className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Không có suất chiếu cho ngày này</h3>
              <p className="text-xs text-slate-500 mb-4">
                Hiện rạp chưa mở lịch chiếu cho ngày đã chọn. Vui lòng chọn một ngày khác trong dải 7 ngày ở trên.
              </p>
              <button
                onClick={() => setSelectedDate(next7Days[0].dateStr)}
                className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl"
              >
                Xem Lịch Chiếu Hôm Nay
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BẢNG GIÁ VÉ */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Bảng Giá Vé Chuẩn Tại {cinema.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Áp dụng cho tất cả các phòng chiếu tiêu chuẩn và phòng chiếu đặc biệt tại cụm rạp
              </p>
            </div>
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors w-fit"
            >
              Giải thích các loại ghế & công nghệ (?)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <th className="p-3.5 rounded-l-xl">Loại Vé & Định Dạng</th>
                  <th className="p-3.5">Mô Tả & Vị Trí</th>
                  <th className="p-3.5 text-center">Thứ 2 - Thứ 5</th>
                  <th className="p-3.5 text-center">Thứ 6 - CN & Lễ</th>
                  <th className="p-3.5 text-center rounded-r-xl">U22 / Học Sinh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cinema.pricingTable.map((price, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{price.ticketType}</td>
                    <td className="p-3.5 text-slate-500 max-w-xs leading-relaxed">{price.description}</td>
                    <td className="p-3.5 text-center font-extrabold text-slate-800">
                      {formatCurrency(price.weekdayPrice)}
                    </td>
                    <td className="p-3.5 text-center font-extrabold text-rose-600">
                      {formatCurrency(price.weekendPrice)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-700">
                      {price.u22Price ? formatCurrency(price.u22Price) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Policy Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-700">📌 Quy Định & Chính Sách Giá Vé:</p>
            <p>• Giá vé U22 / Học sinh sinh viên áp dụng cho khán giả dưới 22 tuổi xuất trình CCCD hoặc thẻ HSSV hợp lệ khi nhận vé.</p>
            <p>• Suất chiếu trước 12:00 (Early Bird) và sau 22:00 (Late Night) áp dụng mức giá ưu đãi đặc biệt tại quầy vé.</p>
            <p>• Giá vé định dạng 3D đã bao gồm phí mượn kính 3D khử trùng chống mỏi mắt.</p>
          </div>
        </div>
      )}

      {/* TAB 3: HƯỚNG DẪN ĐI LẠI & GỬI XE */}
      {activeTab === 'directions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Bike className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-2">Gửi Xe Máy</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {cinema.transportationGuide.motorbike}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Vé thẻ từ thông minh • Giữ vé cẩn thận
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-2">Gửi Xe Ô Tô</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {cinema.transportationGuide.car}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Có trạm sạc điện • Quản lý bãi đỗ tự động
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-2">Lên Sảnh Vé & Phòng Chiếu</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {cinema.transportationGuide.elevator}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Biển chỉ dẫn rõ ràng • Thang máy tốc độ cao
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIỆN ÍCH & KHÔNG GIAN RẠP */}
      {activeTab === 'amenities' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Không Gian & Tiện Ích Đẳng Cấp</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Những đặc quyền trải nghiệm chuẩn quốc tế tại cụm rạp {cinema.name}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cinema.amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold text-sm">
                  ★
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{amenity}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Được đầu tư trang thiết bị tiêu chuẩn cao nhất nhằm mang lại cảm giác thoải mái tối đa cho quý khách trong suốt buổi xem phim.
                  </p>
                </div>
              </div>
            ))}
          </div>
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
