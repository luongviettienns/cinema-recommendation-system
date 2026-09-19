import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { IMovie } from '../../types/movie';
import { movieService } from '../../services/movieService';
import { HeroBanner } from './HeroBanner';
import { QuickBookingBar } from './QuickBookingBar';
import { QuickFilter } from './QuickFilter';
import { MovieCard } from './MovieCard';
import { Film, Search, Sparkles } from 'lucide-react';

export const cleanGenre = (genre: string): string => {
  const stripped = genre.replace(/^Phim\s+/i, '').trim();
  if (!stripped) return genre;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
};

export const matchesGenre = (movieGenres: string[], selectedCategory: string): boolean => {
  if (selectedCategory === 'Tất cả') return true;
  const target = cleanGenre(selectedCategory).toLowerCase();
  return movieGenres.some((g) => {
    const clean = cleanGenre(g).toLowerCase();
    return clean === target || clean.includes(target) || target.includes(clean);
  });
};

export const Home: React.FC = () => {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [showingType, setShowingType] = useState<'now_showing' | 'upcoming'>('now_showing');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const searchKeyword = searchParams.get('search')?.toLowerCase() || '';

  useEffect(() => {
    movieService.getAllMovies().then((data) => {
      setMovies(data);
      setIsLoading(false);
    });
  }, []);

  // Smooth scroll to anchor on hash change with navbar offset
  useEffect(() => {
    if (!isLoading && location.hash) {
      const targetId = location.hash.slice(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          const navOffset = 85;
          const y = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, isLoading]);

  // Dynamically extract all unique genres present in current movies
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    movies.forEach((m) => {
      m.genre.forEach((g) => {
        const cleaned = cleanGenre(g);
        const lower = cleaned.toLowerCase();
        if (!map.has(lower)) {
          map.set(lower, cleaned);
        }
      });
    });
    return ['Tất cả', ...Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'vi'))];
  }, [movies]);

  // Robust Filter Logic
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Search keyword filter
      if (searchKeyword) {
        const matchTitle = movie.title.toLowerCase().includes(searchKeyword);
        const matchOriginal = movie.originalTitle?.toLowerCase().includes(searchKeyword);
        const matchDirector = movie.director.toLowerCase().includes(searchKeyword);
        const matchGenre = movie.genre.some((g) => g.toLowerCase().includes(searchKeyword));
        if (!matchTitle && !matchOriginal && !matchDirector && !matchGenre) {
          return false;
        }
      } else {
        // Tab filter (only active when not explicitly searching)
        if (showingType === 'now_showing' && !movie.isNowShowing) return false;
        if (showingType === 'upcoming' && movie.isNowShowing) return false;
      }

      // Category / Genre filter
      if (!matchesGenre(movie.genre, selectedCategory)) {
        return false;
      }

      return true;
    });
  }, [movies, showingType, selectedCategory, searchKeyword]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">Đang chuẩn bị danh mục phim chiếu rạp...</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero Banner Showcase */}
      {!searchKeyword && <HeroBanner movies={movies} />}

      {/* Floating Quick Booking Bar */}
      {!searchKeyword && (
        <div id="showtimes" className="scroll-mt-24">
          <QuickBookingBar movies={movies} />
        </div>
      )}

      {/* Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 scroll-mt-24" id="now-showing">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-rose-600 text-xs font-black tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Lịch Chiếu Toàn Quốc
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-rose-600" />
            <span>{searchKeyword ? `Kết quả tìm kiếm cho "${searchKeyword}"` : 'Danh Sách Phim Chiếu Rạp'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chọn phim yêu thích và trải nghiệm rạp chiếu chuẩn quốc tế ngay hôm nay
          </p>
        </div>

        {/* Count Pill */}
        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200/80 w-fit">
          Hiển thị <span className="text-rose-600 font-extrabold">{filteredMovies.length}</span> bộ phim
        </div>
      </div>

      {/* Filters */}
      <QuickFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        showingType={showingType}
        onSelectShowingType={setShowingType}
      />

      {/* Movie Grid with Staggered Motion */}
      {filteredMovies.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          <AnimatePresence>
            {filteredMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy phim phù hợp</h3>
          <p className="text-xs text-slate-500 mb-6">
            Không có phim nào thỏa mãn bộ lọc hiện tại. Hãy thử chọn thể loại khác hoặc từ khóa khác.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Tất cả');
              setShowingType('now_showing');
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-4 py-2 rounded-xl cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};
