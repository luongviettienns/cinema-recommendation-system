import { IMovie, IReview } from '../types/movie';
import { IShowtime } from '../types/showtime';
import { mockStorage } from './mockStorage';
import { delay, USE_MOCK, API_BASE_URL } from './api';
import { authService } from './authService';

export const movieService = {
  async getAllMovies(): Promise<IMovie[]> {
    await delay(150);
    return mockStorage.getMovies();
  },

  async getMovieById(id: string): Promise<IMovie | undefined> {
    await delay(150);
    return mockStorage.getMovieById(id);
  },

  async getShowtimesByMovieId(movieId: string): Promise<IShowtime[]> {
    await delay(150);
    return mockStorage.getShowtimesByMovieId(movieId);
  },

  async getShowtimeById(id: string): Promise<IShowtime | undefined> {
    await delay(150);
    return mockStorage.getShowtimeById(id);
  },

  async getMovieReviews(movieId: string): Promise<IReview[]> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/movies/${movieId}/reviews`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data.map((r: any) => ({
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
          const res = await fetch(`${API_BASE_URL}/v1/movies/${movieId}/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ rating, comment }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const r = json.data;
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
  },
};
