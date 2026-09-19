import { ISeat } from '../types/seat';
import { IBooking, ICreateBookingInput } from '../types/booking';
import { mockStorage } from './mockStorage';
import { delay } from './api';

export const bookingService = {
  async getSeatsByShowtime(showtimeId: string, basePrice?: number): Promise<ISeat[]> {
    await delay(150);
    return mockStorage.getSeatsByShowtimeId(showtimeId, basePrice);
  },

  async createBooking(input: ICreateBookingInput): Promise<IBooking> {
    await delay(300);
    const showtime = mockStorage.getShowtimeById(input.showtimeId);
    if (!showtime) throw new Error('Không tìm thấy thông tin suất chiếu');

    const movie = mockStorage.getMovieById(showtime.movieId);
    if (!movie) throw new Error('Không tìm thấy thông tin phim');

    // Generate random booking code
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const bookingCode = `CL-${randomSuffix}`;

    const newBooking: IBooking = {
      id: `booking-${Date.now()}`,
      userId: input.userId,
      showtimeId: input.showtimeId,
      movieTitle: movie.title,
      moviePoster: movie.poster,
      cinemaName: showtime.cinemaName,
      roomName: showtime.roomName,
      showDate: showtime.date,
      showTime: showtime.time,
      format: showtime.format,
      seats: input.seats,
      totalAmount: input.totalAmount,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'completed',
      bookingCode,
      createdAt: new Date().toISOString(),
    };

    return mockStorage.saveBooking(newBooking);
  },

  async getUserBookings(userId?: string): Promise<IBooking[]> {
    await delay(200);
    return mockStorage.getBookings(userId);
  }
};
