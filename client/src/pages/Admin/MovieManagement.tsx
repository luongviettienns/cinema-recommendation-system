import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar, 
  Star, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Tag,
  Eye
} from 'lucide-react';
import { IMovie } from '../../types/movie';
import { IShowtime } from '../../types/showtime';
import { mockStorage } from '../../services/mockStorage';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

const GENRE_OPTIONS = [
  'Hành động',
  'Phiêu lưu',
  'Hoạt hình',
  'Khoa học viễn tưởng',
  'Kinh dị',
  'Hài hước',
  'Tâm lý',
  'Tình cảm',
  'Giật gân',
  'Âm nhạc'
];

const AGE_RATINGS: Array<{ value: IMovie['ageRating']; label: string; desc: string; badgeColor: string }> = [
  { value: 'P', label: 'P - Mọi lứa tuổi', desc: 'Phổ biến cho mọi đối tượng', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'K', label: 'K - Dưới 13 kèm người lớn', desc: 'Khán giả dưới 13 tuổi xem cùng phụ huynh', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'T13', label: 'T13 - Khán giả từ 13 tuổi', desc: 'Cấm người dưới 13 tuổi', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'T16', label: 'T16 - Khán giả từ 16 tuổi', desc: 'Cấm người dưới 16 tuổi', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'T18', label: 'T18 - Khán giả từ 18 tuổi', desc: 'Cấm người dưới 18 tuổi', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export const MovieManagement: React.FC = () => {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOW_SHOWING' | 'COMING_SOON' | 'HOT'>('ALL');
  const [genreFilter, setGenreFilter] = useState('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<IMovie | null>(null);
  const [activeShowtimeCount, setActiveShowtimeCount] = useState(0);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState(120);
  const [formReleaseDate, setFormReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formGenres, setFormGenres] = useState<string[]>(['Hành động']);
  const [formPoster, setFormPoster] = useState('');
  const [formBackdrop, setFormBackdrop] = useState('');
  const [formTrailerUrl, setFormTrailerUrl] = useState('');
  const [formDirector, setFormDirector] = useState('');
  const [formAgeRating, setFormAgeRating] = useState<IMovie['ageRating']>('P');
  const [formIsNowShowing, setFormIsNowShowing] = useState(true);
  const [formIsHot, setFormIsHot] = useState(false);
  const [actorInput, setActorInput] = useState('');
  const [formActors, setFormActors] = useState<string[]>([]);

  // Load data
  const loadData = () => {
    const loadedMovies = mockStorage.getMovies();
    const loadedShowtimes = mockStorage.getShowtimes();
    setMovies(loadedMovies);
    setShowtimes(loadedShowtimes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingMovie) {
      setFormSlug(slugify(val));
    }
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormDuration(115);
    setFormReleaseDate(new Date().toISOString().split('T')[0]);
    setFormGenres(['Hành động']);
    setFormPoster('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80');
    setFormBackdrop('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80');
    setFormTrailerUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setFormDirector('');
    setFormAgeRating('T13');
    setFormIsNowShowing(true);
    setFormIsHot(false);
    setFormActors(['Diễn viên chính 1', 'Diễn viên 2']);
    setIsFormModalOpen(true);
  };

  const openEditModal = (movie: IMovie) => {
    setEditingMovie(movie);
    setFormTitle(movie.title);
    setFormSlug(slugify(movie.title));
    setFormDescription(movie.description);
    setFormDuration(movie.duration);
    setFormReleaseDate(movie.releaseDate);
    setFormGenres(movie.genre);
    setFormPoster(movie.poster);
    setFormBackdrop(movie.backdrop);
    setFormTrailerUrl(movie.trailerUrl || '');
    setFormDirector(movie.director);
    setFormAgeRating(movie.ageRating);
    setFormIsNowShowing(movie.isNowShowing);
    setFormIsHot(movie.isHot || false);
    setFormActors(movie.cast?.map((c) => c.name) || []);
    setIsFormModalOpen(true);
  };

  const handleAddActor = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && actorInput.trim()) {
      e.preventDefault();
      if (!formActors.includes(actorInput.trim())) {
        setFormActors([...formActors, actorInput.trim()]);
      }
      setActorInput('');
    }
  };

  const removeActor = (name: string) => {
    setFormActors(formActors.filter((a) => a !== name));
  };

  const toggleGenre = (genre: string) => {
    if (formGenres.includes(genre)) {
      if (formGenres.length > 1) {
        setFormGenres(formGenres.filter((g) => g !== genre));
      } else {
        toast.error('Phim phải có ít nhất một thể loại');
      }
    } else {
      setFormGenres([...formGenres, genre]);
    }
  };

  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Vui lòng nhập tên phim');
      return;
    }
    if (formDuration <= 0) {
      toast.error('Thời lượng phim phải lớn hơn 0');
      return;
    }

    const castList = formActors.map((name, index) => ({
      id: `c-${Date.now()}-${index}`,
      name,
      character: 'Diễn viên',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + index}?w=150&auto=format&fit=crop&q=80`,
    }));

    if (editingMovie) {
      const updated: IMovie = {
        ...editingMovie,
        title: formTitle.trim(),
        description: formDescription.trim(),
        duration: Number(formDuration),
        releaseDate: formReleaseDate,
        genre: formGenres,
        poster: formPoster.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
        backdrop: formBackdrop.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: formTrailerUrl.trim(),
        director: formDirector.trim() || 'Chưa cập nhật',
        ageRating: formAgeRating,
        isNowShowing: formIsNowShowing,
        isHot: formIsHot,
        cast: castList.length > 0 ? castList : editingMovie.cast,
      };

      mockStorage.updateMovie(updated);
      toast.success(`Đã cập nhật phim: ${updated.title}`);
    } else {
      const newMovie: IMovie = {
        id: `movie-${Date.now()}`,
        title: formTitle.trim(),
        description: formDescription.trim(),
        duration: Number(formDuration),
        releaseDate: formReleaseDate,
        genre: formGenres,
        poster: formPoster.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
        backdrop: formBackdrop.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        rating: 8.5,
        ageRating: formAgeRating,
        formats: ['2D', '3D', 'IMAX'],
        trailerUrl: formTrailerUrl.trim(),
        director: formDirector.trim() || 'Chưa cập nhật',
        cast: castList,
        isNowShowing: formIsNowShowing,
        isHot: formIsHot,
      };

      mockStorage.addMovie(newMovie);
      toast.success(`Đã thêm phim mới: ${newMovie.title}`);
    }

    setIsFormModalOpen(false);
    loadData();
  };

  const handleQuickStatusChange = (movie: IMovie, newIsNowShowing: boolean) => {
    const updated = { ...movie, isNowShowing: newIsNowShowing };
    mockStorage.updateMovie(updated);
    toast.success(`Đã đổi trạng thái "${movie.title}" sang: ${newIsNowShowing ? 'Đang chiếu' : 'Sắp chiếu'}`);
    loadData();
  };

  const handlePromptDelete = (movie: IMovie) => {
    // Count active showtimes for this movie
    const count = showtimes.filter((st) => st.movieId === movie.id).length;
    setActiveShowtimeCount(count);
    setDeleteCandidate(movie);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;

    if (activeShowtimeCount > 0) {
      toast.error('CHẶN XÓA: Phim đang có suất chiếu đã lên lịch!', {
        description: `Vui lòng hủy hoặc xóa ${activeShowtimeCount} suất chiếu liên quan trước khi xóa phim này.`,
      });
      return;
    }

    mockStorage.deleteMovie(deleteCandidate.id);
    toast.success(`Đã xóa phim: ${deleteCandidate.title}`);
    setDeleteCandidate(null);
    loadData();
  };

  // Filtered list
  const filteredMovies = movies.filter((m) => {
    const matchSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.director && m.director.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'NOW_SHOWING' ? m.isNowShowing :
      statusFilter === 'COMING_SOON' ? !m.isNowShowing :
      statusFilter === 'HOT' ? m.isHot : true;

    const matchGenre = genreFilter === 'ALL' ? true : m.genre.includes(genreFilter);

    return matchSearch && matchStatus && matchGenre;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-600" />
            <span>Danh Mục Phim Chiếu Rạp ({movies.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin, phân loại độ tuổi, poster và trạng thái chiếu rạp trên toàn hệ thống.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          className="font-bold shadow-md shadow-rose-900/20 cursor-pointer"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Thêm Phim Mới
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên phim, đạo diễn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 placeholder:text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-rose-500 shadow-xs font-medium"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-white text-slate-800 text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-rose-500 shadow-xs font-semibold cursor-pointer"
          >
            <option value="ALL">Tất Cả Trạng Thái</option>
            <option value="NOW_SHOWING">🎬 Đang Chiếu</option>
            <option value="COMING_SOON">⏳ Sắp Chiếu</option>
            <option value="HOT">🔥 Phim Bom Tấn</option>
          </select>
        </div>

        <div>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="w-full bg-white text-slate-800 text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-rose-500 shadow-xs font-semibold cursor-pointer"
          >
            <option value="ALL">Tất Cả Thể Loại</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Poster</th>
                <th className="py-3.5 px-4">Tên Phim & Độ Tuổi</th>
                <th className="py-3.5 px-4">Thể Loại</th>
                <th className="py-3.5 px-4">Thời Lượng</th>
                <th className="py-3.5 px-4">Khởi Chiếu</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Suất Chiếu</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMovies.map((movie) => {
                const count = showtimes.filter((st) => st.movieId === movie.id).length;
                const ratingBadge = AGE_RATINGS.find((r) => r.value === movie.ageRating);

                return (
                  <tr key={movie.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Poster */}
                    <td className="py-3.5 px-4">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-12 h-16 object-cover rounded-lg shadow-xs border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&auto=format&fit=crop&q=80';
                        }}
                      />
                    </td>

                    {/* Title & Age Rating */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 line-clamp-1">{movie.title}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${ratingBadge?.badgeColor || 'bg-slate-100'}`}>
                          {movie.ageRating}
                        </span>
                        {movie.isHot && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> HOT
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">★ {movie.rating}</span>
                      </div>
                    </td>

                    {/* Genres */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {movie.genre?.slice(0, 2).map((g) => (
                          <span key={g} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {g}
                          </span>
                        ))}
                        {movie.genre && movie.genre.length > 2 && (
                          <span className="text-[10px] font-semibold text-slate-400">+{movie.genre.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {movie.duration} phút
                      </span>
                    </td>

                    {/* Release Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {movie.releaseDate}
                    </td>

                    {/* Status & Quick Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={movie.isNowShowing ? 'NOW_SHOWING' : 'COMING_SOON'}
                        onChange={(e) => handleQuickStatusChange(movie, e.target.value === 'NOW_SHOWING')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          movie.isNowShowing
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="NOW_SHOWING">Đang Chiếu</option>
                        <option value="COMING_SOON">Sắp Chiếu</option>
                      </select>
                    </td>

                    {/* Showtimes count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full ${
                        count > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {count} suất
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(movie)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa phim"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(movie)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa phim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMovies.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Không tìm thấy bộ phim nào phù hợp</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingMovie ? 'Chỉnh Sửa Bộ Phim' : 'Thêm Phim Chiếu Rạp Mới'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingMovie ? `Đang chỉnh sửa: ${editingMovie.title}` : 'Nhập đầy đủ thông tin chuẩn định dạng rạp chiếu'}
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveMovie} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tên Phim *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ví dụ: Avatar 3: Lửa Và Tro Tàn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Slug Đường Dẫn</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="avatar-3-lua-va-tro-tan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-xs font-mono text-slate-500 bg-slate-50"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Thời Lượng (Phút) *</label>
                  <input
                    type="number"
                    min={30}
                    max={300}
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                  />
                </div>

                {/* Release Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ngày Khởi Chiếu *</label>
                  <input
                    type="date"
                    required
                    value={formReleaseDate}
                    onChange={(e) => setFormReleaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                  />
                </div>

                {/* Age Rating */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phân Loại Độ Tuổi</label>
                  <select
                    value={formAgeRating}
                    onChange={(e) => setFormAgeRating(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                  >
                    {AGE_RATINGS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Director */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Đạo Diễn</label>
                  <input
                    type="text"
                    value={formDirector}
                    onChange={(e) => setFormDirector(e.target.value)}
                    placeholder="Ví dụ: James Cameron"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm"
                  />
                </div>

                {/* Trailer URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Trailer URL (YouTube)</label>
                  <input
                    type="text"
                    value={formTrailerUrl}
                    onChange={(e) => setFormTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm"
                  />
                </div>

                {/* Poster URL */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Poster URL (Ảnh dọc)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={formPoster}
                      onChange={(e) => setFormPoster(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm"
                    />
                    {formPoster && (
                      <img src={formPoster} alt="Preview" className="w-10 h-14 object-cover rounded border border-slate-200" />
                    )}
                  </div>
                </div>

                {/* Genres selection */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Thể Loại Phim (Chọn nhiều)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRE_OPTIONS.map((g) => {
                      const selected = formGenres.includes(g);
                      return (
                        <button
                          type="button"
                          key={g}
                          onClick={() => toggleGenre(g)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            selected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {selected ? `✓ ${g}` : g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actors Tag Input */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Diễn Viên (Nhập tên và gõ Enter)</label>
                  <input
                    type="text"
                    value={actorInput}
                    onChange={(e) => setActorInput(e.target.value)}
                    onKeyDown={handleAddActor}
                    placeholder="Gõ tên diễn viên và nhấn Enter để thêm..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formActors.map((actor) => (
                      <span key={actor} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                        {actor}
                        <button type="button" onClick={() => removeActor(actor)} className="text-slate-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="sm:col-span-2 flex items-center gap-6 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsNowShowing}
                      onChange={(e) => setFormIsNowShowing(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Đang Chiếu Rạp (Now Showing)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsHot}
                      onChange={(e) => setFormIsHot(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Phim Bom Tấn Nổi Bật (Hot Movie)
                    </span>
                  </label>
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mô Tả / Nội Dung Phim</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn cốt truyện phim..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold px-6 cursor-pointer"
                >
                  {editingMovie ? 'Lưu Thay Đổi' : 'Tạo Phim Mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Xác Nhận Xóa Phim?</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa bộ phim <strong>"{deleteCandidate.title}"</strong> khỏi hệ thống?
              </p>
            </div>

            {activeShowtimeCount > 0 ? (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>CẢNH BÁO: CHẶN XÓA PHIM NÀY!</span>
                </div>
                <p>
                  Bộ phim này đang có <strong>{activeShowtimeCount} suất chiếu</strong> trong lịch hoạt động của các cụm rạp. Theo quy chuẩn an toàn dữ liệu, hệ thống từ chối xóa phim khi còn suất chiếu tương lai.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                ✓ Phim này không có suất chiếu nào liên quan. Thao tác xóa sẽ xóa phim khỏi danh sách.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={activeShowtimeCount > 0}
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
