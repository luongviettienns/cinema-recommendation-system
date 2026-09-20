import { IMovie, IReview } from '../types/movie';
import { IShowtime } from '../types/showtime';
import { ISeat } from '../types/seat';
import { IBooking } from '../types/booking';
import { IUser } from '../types/user';
import { INITIAL_MOVIES } from '../data/mockMovies';
import { generateInitialShowtimes } from '../data/mockShowtimes';
import { generateSeatsForShowtime } from '../data/mockSeats';

const KEYS = {
  MOVIES: 'cinelight_movies',
  SHOWTIMES: 'cinelight_showtimes',
  SEATS_PREFIX: 'cinelight_seats_',
  BOOKINGS: 'cinelight_bookings',
  REVIEWS: 'cinelight_reviews',
  USER: 'cinelight_user',
  TOKEN: 'cinelight_token',
};

// Initial Demo Reviews
const INITIAL_REVIEWS: IReview[] = [
  {
    id: 'rev-1',
    movieId: 'tmdb-1204680',
    userId: 'user-demo-1',
    userName: 'Nguyễn Văn A',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: 9,
    comment: 'Phim hoạt họa kết hợp người đóng vô cùng duyên dáng và hài hước! Âm thanh rạp CineLight tái hiện tiếng nổ của đồ chơi Acme cực kỳ bùng nổ, xem giải trí cuối tuần cùng gia đình hết ý!',
    createdAt: '2026-09-18T14:30:00.000Z',
  },
  {
    id: 'rev-2',
    movieId: 'tmdb-1204680',
    userId: 'user-rev-2',
    userName: 'Trần Thị Mai Phương',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 8,
    comment: 'Cốt truyện kiện tụng pháp đình rất sáng tạo nhưng vẫn giữ nguyên tinh thần tuổi thơ của Looney Tunes. John Cena diễn xuất tếu táo rất hợp vai luật sư!',
    createdAt: '2026-09-17T09:15:00.000Z',
  },
  {
    id: 'rev-3',
    movieId: 'tmdb-1204680',
    userId: 'user-rev-3',
    userName: 'Lê Hoàng Nam',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    rating: 10,
    comment: 'Đỉnh cao tuổi thơ! Từng khung hình được chau chuốt tỉ mỉ, nhịp phim nhanh gọn không một giây thừa thãi. Rạp chiếu âm thanh Dolby sống động.',
    createdAt: '2026-09-16T20:45:00.000Z',
  },
  {
    id: 'rev-4',
    movieId: 'tmdb-1101383',
    userId: 'user-rev-4',
    userName: 'Phạm Quỳnh Anh',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    rating: 8,
    comment: 'Kịch bản sinh tồn gia đình đầy hồi hộp, bối cảnh siêu thực được dựng CGI khá mượt mà. Đáng tiền vé!',
    createdAt: '2026-09-15T18:20:00.000Z',
  },
  {
    id: 'rev-5',
    movieId: 'tmdb-1101383',
    userId: 'user-rev-5',
    userName: 'Đỗ Quang Huy',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 7,
    comment: 'Phim có ý tưởng lạ, diễn biến nửa đầu rất cuốn. Đoạn kết hơi vội một chút nhưng tổng thể vẫn là tác phẩm đáng xem tại rạp.',
    createdAt: '2026-09-14T21:00:00.000Z',
  }
];

// Initial Demo User
const DEMO_USER: IUser = {
  id: 'user-demo-1',
  name: 'Nguyễn Văn A',
  email: 'demo@cinema.vn',
  phone: '0901234567',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

export const mockStorage = {
  init() {
    const TMDB_VERSION = '2026-tmdb-real-v1';
    const currentVersion = localStorage.getItem('cinelight_tmdb_version');

    if (currentVersion !== TMDB_VERSION || !localStorage.getItem(KEYS.MOVIES)) {
      localStorage.setItem(KEYS.MOVIES, JSON.stringify(INITIAL_MOVIES));
      localStorage.setItem(KEYS.SHOWTIMES, JSON.stringify(generateInitialShowtimes()));
      localStorage.setItem('cinelight_tmdb_version', TMDB_VERSION);
    }
    if (!localStorage.getItem(KEYS.BOOKINGS)) {
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.REVIEWS)) {
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    }
    if (!localStorage.getItem(KEYS.USER)) {
      localStorage.setItem(KEYS.USER, JSON.stringify(DEMO_USER));
      localStorage.setItem(KEYS.TOKEN, 'mock-jwt-token-demo-xyz');
    }
  },

  getMovies(): IMovie[] {
    this.init();
    const data = localStorage.getItem(KEYS.MOVIES);
    return data ? JSON.parse(data) : INITIAL_MOVIES;
  },

  getMovieById(id: string): IMovie | undefined {
    return this.getMovies().find((m) => m.id === id);
  },

  addMovie(movie: IMovie): IMovie {
    const movies = this.getMovies();
    movies.unshift(movie);
    localStorage.setItem(KEYS.MOVIES, JSON.stringify(movies));
    return movie;
  },

  updateMovie(updated: IMovie): IMovie {
    const movies = this.getMovies().map((m) => (m.id === updated.id ? updated : m));
    localStorage.setItem(KEYS.MOVIES, JSON.stringify(movies));
    return updated;
  },

  deleteMovie(id: string): boolean {
    const movies = this.getMovies().filter((m) => m.id !== id);
    localStorage.setItem(KEYS.MOVIES, JSON.stringify(movies));
    return true;
  },

  getShowtimes(): IShowtime[] {
    this.init();
    const data = localStorage.getItem(KEYS.SHOWTIMES);
    return data ? JSON.parse(data) : [];
  },

  getShowtimesByMovieId(movieId: string): IShowtime[] {
    return this.getShowtimes().filter((st) => st.movieId === movieId);
  },

  getShowtimeById(id: string): IShowtime | undefined {
    return this.getShowtimes().find((st) => st.id === id);
  },

  addShowtime(showtime: IShowtime): IShowtime {
    const showtimes = this.getShowtimes();
    showtimes.unshift(showtime);
    localStorage.setItem(KEYS.SHOWTIMES, JSON.stringify(showtimes));
    return showtime;
  },

  deleteShowtime(id: string): boolean {
    const showtimes = this.getShowtimes().filter((st) => st.id !== id);
    localStorage.setItem(KEYS.SHOWTIMES, JSON.stringify(showtimes));
    return true;
  },

  getSeatsByShowtimeId(showtimeId: string, basePrice = 90000): ISeat[] {
    this.init();
    const key = `${KEYS.SEATS_PREFIX}${showtimeId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    const freshSeats = generateSeatsForShowtime(basePrice);
    localStorage.setItem(key, JSON.stringify(freshSeats));
    return freshSeats;
  },

  updateSeats(showtimeId: string, bookedSeatNumbers: string[]): ISeat[] {
    const seats = this.getSeatsByShowtimeId(showtimeId);
    const updated = seats.map((s) => {
      if (bookedSeatNumbers.includes(s.seatNumber)) {
        return { ...s, isBooked: true };
      }
      return s;
    });
    localStorage.setItem(`${KEYS.SEATS_PREFIX}${showtimeId}`, JSON.stringify(updated));
    return updated;
  },

  getBookings(userId?: string): IBooking[] {
    this.init();
    const data = localStorage.getItem(KEYS.BOOKINGS);
    const bookings: IBooking[] = data ? JSON.parse(data) : [];
    if (userId) {
      return bookings.filter((b) => b.userId === userId);
    }
    return bookings;
  },

  saveBooking(booking: IBooking): IBooking {
    const bookings = this.getBookings();
    bookings.unshift(booking); // newest first
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    // Also mark seats as booked
    this.updateSeats(booking.showtimeId, booking.seats);
    return booking;
  },

  getReviews(movieId?: string): IReview[] {
    this.init();
    const data = localStorage.getItem(KEYS.REVIEWS);
    const reviews: IReview[] = data ? JSON.parse(data) : [];
    if (movieId) {
      return reviews.filter((r) => r.movieId === movieId);
    }
    return reviews;
  },

  addReview(review: IReview): IReview {
    const reviews = this.getReviews();
    reviews.unshift(review);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));

    // Also recalculate movie rating
    const movieReviews = reviews.filter((r) => r.movieId === review.movieId);
    if (movieReviews.length > 0) {
      const avg = movieReviews.reduce((sum, r) => sum + r.rating, 0) / movieReviews.length;
      const movie = this.getMovieById(review.movieId);
      if (movie) {
        movie.rating = Number(avg.toFixed(1));
        this.updateMovie(movie);
      }
    }

    return review;
  },

  getUser(): IUser | null {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  getToken(): string | null {
    return localStorage.getItem(KEYS.TOKEN);
  },

  setUser(user: IUser, token: string) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    localStorage.setItem(KEYS.TOKEN, token);
  },

  clearUser() {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.TOKEN);
  }
};
