import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  MapPin, 
  Film, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Trash2, 
  Ticket,
  Sliders,
  DollarSign
} from 'lucide-react';
import { IShowtime } from '../../types/showtime';
import { IMovie } from '../../types/movie';
import { mockStorage } from '../../services/mockStorage';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface ICinemaOption {
  name: string;
  rooms: string[];
}

const CINEMA_ROOMS: ICinemaOption[] = [
  {
    name: 'CineLight Landmark 81',
    rooms: ['Phòng 01 - IMAX Laser', 'Phòng 02 - Dolby Atmos', 'Phòng 03 - 2D Digital']
  },
  {
    name: 'CineLight Cầu Giấy',
    rooms: ['Phòng 01 - IMAX Laser', 'Phòng 02 - Dolby Atmos', 'Phòng 03 - 2D Digital']
  },
  {
    name: 'CineLight Quận 1',
    rooms: ['Phòng 01 - ScreenX', 'Phòng 02 - Dolby Atmos', 'Phòng 03 - 2D Digital']
  }
];

export const ShowtimeManagement: React.FC = () => {
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [selectedCinema, setSelectedCinema] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMovieId, setSelectedMovieId] = useState('ALL');

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMovieId, setFormMovieId] = useState('');
  const [formCinema, setFormCinema] = useState(CINEMA_ROOMS[0].name);
  const [formRoom, setFormRoom] = useState(CINEMA_ROOMS[0].rooms[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('19:00');
  const [formFormat, setFormFormat] = useState<'2D' | '3D' | 'IMAX'>('2D');
  const [formLanguage, setFormLanguage] = useState<'Phụ đề' | 'Lồng tiếng'>('Phụ đề');
  const [formBasePrice, setFormBasePrice] = useState(90000);

  const loadData = () => {
    const sts = mockStorage.getShowtimes();
    const mvs = mockStorage.getMovies();
    setShowtimes(sts);
    setMovies(mvs);
    if (mvs.length > 0 && !formMovieId) {
      setFormMovieId(mvs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute End Time = startTime + movieDuration + 15 mins buffer
  const selectedMovie = movies.find((m) => m.id === formMovieId);
  const calculateEndTime = (startStr: string, durationMinutes: number) => {
    const [hours, minutes] = startStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes + 15; // 15 mins cleaning buffer
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const computedEndTime = selectedMovie 
    ? calculateEndTime(formStartTime, selectedMovie.duration) 
    : '21:15';

  const handleCinemaChange = (cinemaName: string) => {
    setFormCinema(cinemaName);
    const cin = CINEMA_ROOMS.find((c) => c.name === cinemaName);
    if (cin && cin.rooms.length > 0) {
      setFormRoom(cin.rooms[0]);
    }
  };

  const handleCreateShowtime = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formMovieId) {
      toast.error('Vui lòng chọn bộ phim');
      return;
    }

    // Overlap conflict detection check!
    // Check if another showtime exists in the same cinema, same room, same date
    const sameRoomShowtimes = showtimes.filter(
      (st) => st.cinemaName === formCinema && st.roomName === formRoom && st.date === formDate
    );

    const startMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = startMinutes(formStartTime);
    const newEnd = startMinutes(computedEndTime);

    // Conflict exists if NOT (newEnd <= existingStart OR newStart >= existingEnd)
    const conflict = sameRoomShowtimes.find((st) => {
      const existingMovie = movies.find((m) => m.id === st.movieId);
      const duration = existingMovie?.duration || 120;
      const existingStart = startMinutes(st.time);
      const existingEnd = startMinutes(calculateEndTime(st.time, duration));

      const isOutside = newEnd <= existingStart || newStart >= existingEnd;
      return !isOutside;
    });

    if (conflict) {
      const conflictMovie = movies.find((m) => m.id === conflict.movieId);
      toast.error('XUNG ĐỘT TRÙNG LỊCH PHÒNG CHIẾU!', {
        description: `Phòng "${formRoom}" đã có suất chiếu phim "${conflictMovie?.title || 'Phim'}" từ ${conflict.time} (kèm 15p dọn dẹp). Vui lòng chọn khung giờ khác!`,
      });
      return;
    }

    const newShowtime: IShowtime = {
      id: `st-${Date.now()}`,
      movieId: formMovieId,
      cinemaName: formCinema,
      roomName: formRoom,
      date: formDate,
      time: formStartTime,
      endTime: computedEndTime,
      format: formFormat,
      language: formLanguage,
      basePrice: Number(formBasePrice),
      soldSeatsCount: 0,
      totalSeatsCount: 80,
    };

    mockStorage.addShowtime(newShowtime);
    toast.success(`Đã lên lịch thành công cho phim "${selectedMovie?.title}"!`, {
      description: `${formCinema} • ${formRoom} • ${formStartTime} - ${computedEndTime}`,
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteShowtime = (st: IShowtime) => {
    // Check if tickets sold
    if (st.soldSeatsCount && st.soldSeatsCount > 0) {
      toast.error('CHẶN HỦY: Suất chiếu này ĐÃ CÓ VÉ BÁN RA!', {
        description: `Đã có ${st.soldSeatsCount} ghế được đặt. Vui lòng liên hệ hỗ trợ hoặc xử lý hoàn vé cho khách trước khi hủy.`,
      });
      return;
    }

    const movie = movies.find((m) => m.id === st.movieId);
    mockStorage.deleteShowtime(st.id);
    toast.success(`Đã xóa suất chiếu: ${movie?.title || ''} (${st.time})`);
    loadData();
  };

  // Filtered showtimes
  const filteredShowtimes = showtimes.filter((st) => {
    const matchCinema = selectedCinema === 'ALL' ? true : st.cinemaName === selectedCinema;
    const matchDate = selectedDate ? st.date === selectedDate : true;
    const matchMovie = selectedMovieId === 'ALL' ? true : st.movieId === selectedMovieId;
    return matchCinema && matchDate && matchMovie;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-600" />
            <span>Quản Lý Lịch Chiếu & Phòng ({showtimes.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lên lịch chiếu phim, tự động tính giờ dọn rạp 15 phút và kiểm soát chống trùng lịch phòng chiếu.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="font-bold shadow-md shadow-rose-900/20 cursor-pointer"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Lên Lịch Suất Chiếu
        </Button>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cinema filter */}
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Cụm Rạp</label>
          <select
            value={selectedCinema}
            onChange={(e) => setSelectedCinema(e.target.value)}
            className="w-full bg-white text-slate-800 text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-rose-500 shadow-xs font-semibold cursor-pointer"
          >
            <option value="ALL">Tất Cả Cụm Rạp (3 rạp)</option>
            {CINEMA_ROOMS.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Date filter */}
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Ngày Chiếu</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-white text-slate-800 text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-rose-500 shadow-xs font-semibold"
          />
        </div>

        {/* Movie filter */}
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Bộ Phim</label>
          <select
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
            className="w-full bg-white text-slate-800 text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-rose-500 shadow-xs font-semibold cursor-pointer"
          >
            <option value="ALL">Tất Cả Phim</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Showtimes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Bộ Phim</th>
                <th className="py-3.5 px-4">Cụm Rạp & Phòng</th>
                <th className="py-3.5 px-4">Định Dạng</th>
                <th className="py-3.5 px-4">Giá Vé Chuẩn</th>
                <th className="py-3.5 px-4 text-center">Ghế Đã Bán</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredShowtimes.map((st) => {
                const movie = movies.find((m) => m.id === st.movieId);
                const duration = movie?.duration || 120;
                const endTime = st.endTime || calculateEndTime(st.time, duration);

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Time slot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-black text-rose-600 text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {st.time} - {endTime}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{st.date}</div>
                    </td>

                    {/* Movie info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {movie && (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-8 h-11 object-cover rounded shadow-xs border border-slate-200"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {movie?.title || 'Phim đã xóa'}
                          </div>
                          <div className="text-[11px] text-slate-400">{movie?.duration} phút</div>
                        </div>
                      </div>
                    </td>

                    {/* Cinema & Room */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{st.cinemaName}</div>
                      <div className="text-[11px] text-purple-700 font-semibold">{st.roomName}</div>
                    </td>

                    {/* Format & Language */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border mr-1.5 ${
                        st.format === 'IMAX' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        st.format === '3D' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {st.format}
                      </span>
                      <span className="text-[11px] text-slate-500">{st.language}</span>
                    </td>

                    {/* Base Price */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      {st.basePrice?.toLocaleString('vi-VN')} đ
                    </td>

                    {/* Seats sold */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                        (st.soldSeatsCount || 0) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {st.soldSeatsCount || 0} / {st.totalSeatsCount || 80}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteShowtime(st)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa suất chiếu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredShowtimes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Không có suất chiếu nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Lên Lịch Suất Chiếu Mới</h3>
                <p className="text-xs text-slate-400">Tự động tính giờ kết thúc và bảo vệ chống trùng phòng</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateShowtime} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Select Movie */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Chọn Phim Chiếu *</label>
                <select
                  required
                  value={formMovieId}
                  onChange={(e) => setFormMovieId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} phút • {m.ageRating})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cinema & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cụm Rạp *</label>
                  <select
                    value={formCinema}
                    onChange={(e) => handleCinemaChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-xs font-semibold"
                  >
                    {CINEMA_ROOMS.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phòng Chiếu *</label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-xs font-semibold"
                  >
                    {CINEMA_ROOMS.find((c) => c.name === formCinema)?.rooms.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Start Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ngày Chiếu *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Giờ Bắt Đầu *</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Auto calculated End Time Callout */}
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-900 block">Thời gian kết thúc dự kiến:</span>
                  <span className="text-purple-700 text-[11px]">
                    = {formStartTime} + {selectedMovie?.duration || 120} phút phim + 15 phút dọn rạp
                  </span>
                </div>
                <div className="font-mono font-black text-base text-purple-950 bg-white px-3 py-1 rounded-lg border border-purple-200 shadow-2xs">
                  {computedEndTime}
                </div>
              </div>

              {/* Format & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Định Dạng</label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-xs font-semibold"
                  >
                    <option value="2D">2D Digital</option>
                    <option value="3D">3D Digital</option>
                    <option value="IMAX">IMAX Laser</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ngôn Ngữ</label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-xs font-semibold"
                  >
                    <option value="Phụ đề">Phụ đề tiếng Việt</option>
                    <option value="Lồng tiếng">Lồng tiếng tiếng Việt</option>
                  </select>
                </div>
              </div>

              {/* Base Price */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Giá Vé Cơ Bản (Ghế Thường)</label>
                <div className="relative">
                  <input
                    type="number"
                    step={5000}
                    min={45000}
                    max={300000}
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    className="w-full pl-8 pr-12 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₫</span>
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-semibold">VNĐ</span>
                </div>
                <p className="text-[11px] text-slate-400">Ghế VIP tự động = Giá cơ bản + 20.000đ; Ghế Đôi = Giá cơ bản + 40.000đ.</p>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold px-6 cursor-pointer"
                >
                  Xác Nhận Lên Lịch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
