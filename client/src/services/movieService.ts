import { IMovie, IReview } from '../types/movie';
import { IShowtime } from '../types/showtime';
import { mockStorage } from './mockStorage';
import { delay, USE_MOCK, apiRequest } from './api';
import { authService } from './authService';

function mapBackendMovie(m: any): IMovie {
  return {
    id: m.id,
    title: m.title,
    originalTitle: m.originalTitle,
    description: m.description,
    duration: m.duration,
    releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().split('T')[0] : '2026-09-20',
    genre: Array.isArray(m.movieGenres) && m.movieGenres.length > 0
      ? m.movieGenres.map((mg: any) => mg.genre?.name || mg.genreId).filter(Boolean)
      : (Array.isArray(m.genre) ? m.genre : ['Hành Động']),
    poster: m.poster,
    backdrop: m.backdrop || m.poster,
    rating: m.rating || 0,
    ageRating: m.ageRating || 'P',
    formats: ['2D', '3D', 'IMAX'],
    trailerUrl: m.trailerUrl || '',
    director: m.director || 'Đang cập nhật',
    cast: Array.isArray(m.cast) ? m.cast : [],
    isHot: m.isHot ?? false,
    isNowShowing: m.isNowShowing ?? true,
  };
}

function mapBackendShowtime(s: any): IShowtime {
  const start = new Date(s.startTime);
  const end = new Date(s.endTime);
  const timeStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  const dateStr = start.toISOString().split('T')[0];

  return {
    id: s.id,
    movieId: s.movieId,
    cinemaName: s.room?.cinema?.name || s.cinemaName || 'CineLight Cinema',
    roomName: s.room?.name || s.roomName || 'Phòng chiếu',
    date: dateStr,
    time: timeStr,
    endTime: endTimeStr,
    format: s.format === 'IMAX' ? 'IMAX' : (s.format === 'THREE_D' ? '3D' : '2D'),
    language: (s.language?.includes('Lồng') ? 'Lồng tiếng' : 'Phụ đề') as any,
    basePrice: s.basePrice || 90000,
    totalSeatsCount: s.room?.seats?.length || 80,
    soldSeatsCount: s.soldSeatsCount || 0,
  };
}

export const movieService = {
  async getAllMovies(): Promise<IMovie[]> {
    if (!USE_MOCK) {
      try {
        const movies = await apiRequest<any[]>('/v1/movies');
        if (Array.isArray(movies) && movies.length > 0) {
          return movies.map(mapBackendMovie);
        }
      } catch (err) {
        console.warn('Backend API getAllMovies failed, fallback to mockStorage', err);
      }
    }
    await delay(150);
    return mockStorage.getMovies();
  },

  async getMovieById(id: string): Promise<IMovie | undefined> {
    if (!USE_MOCK) {
      try {
        const movie = await apiRequest<any>(`/v1/movies/${id}`);
        if (movie) {
          return mapBackendMovie(movie);
        }
      } catch (err) {
        console.warn(`Backend API getMovieById(${id}) failed, fallback to mockStorage`, err);
      }
    }
    await delay(150);
    return mockStorage.getMovieById(id);
  },

  async getShowtimesByMovieId(movieId: string): Promise<IShowtime[]> {
    if (!USE_MOCK) {
      try {
        const showtimes = await apiRequest<any[]>(`/v1/showtimes?movieId=${movieId}`);
        if (Array.isArray(showtimes) && showtimes.length > 0) {
          return showtimes.map(mapBackendShowtime);
        }
      } catch (err) {
        console.warn('Backend API getShowtimesByMovieId failed, fallback to mockStorage', err);
      }
    }
    await delay(150);
    return mockStorage.getShowtimesByMovieId(movieId);
  },

  async getShowtimeById(id: string): Promise<IShowtime | undefined> {
    if (!USE_MOCK) {
      try {
        const showtime = await apiRequest<any>(`/v1/showtimes/${id}`);
        if (showtime) {
          return mapBackendShowtime(showtime);
        }
      } catch (err) {
        console.warn(`Backend API getShowtimeById(${id}) failed, fallback to mockStorage`, err);
      }
    }
    await delay(150);
    return mockStorage.getShowtimeById(id);
  },

  async getMovieReviews(movieId: string): Promise<IReview[]> {
    if (!USE_MOCK) {
      try {
        const reviews = await apiRequest<any[]>(`/v1/movies/${movieId}/reviews`);
        if (Array.isArray(reviews)) {
          return reviews.map((r: any) => ({
            id: r.id,
            movieId: r.movieId,
            userId: r.userId,
            userName: r.user?.name || 'Khán giả CineLight',
            userAvatar: r.user?.avatar,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          }));
        }
      } catch (err) {
        console.warn('Backend API reviews fetch failed, fallback to mockStorage', err);
      }
    }
    await delay(150);
    return mockStorage.getReviews(movieId);
  },

  async createMovieReview(movieId: string, rating: number, comment: string): Promise<IReview> {
    if (!USE_MOCK) {
      const token = authService.getToken();
      if (token) {
        try {
          const r = await apiRequest<any>(`/v1/movies/${movieId}/reviews`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment }),
          });
          if (r) {
            return {
              id: r.id,
              movieId: r.movieId,
              userId: r.userId,
              userName: r.user?.name || authService.getCurrentUser()?.name || 'Khán giả CineLight',
              userAvatar: r.user?.avatar || authService.getCurrentUser()?.avatar,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt,
            };
          }
        } catch (err) {
          console.warn('Backend API review creation failed, fallback to mockStorage', err);
        }
      }
    }

    await delay(200);
    const currentUser = authService.getCurrentUser() || {
      id: 'anonymous-user',
      name: 'Khán giả CineLight',
      avatar: undefined,
    };

    const newReview: IReview = {
      id: `rev-${Date.now()}`,
      movieId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    return mockStorage.addReview(newReview);
  }
};
