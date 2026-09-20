import { ISeat } from '../types/seat';
import { IBooking, ICreateBookingInput } from '../types/booking';
import { mockStorage } from './mockStorage';
import { delay, USE_MOCK, apiRequest } from './api';

export interface HoldSeatsResult {
  bookingId: string;
  bookingCode: string;
  totalAmount: number;
  expiresAt: string;
  expiresSeconds: number;
}

export const bookingService = {
  async getSeatsByShowtime(showtimeId: string, basePrice: number = 90000): Promise<ISeat[]> {
    if (!USE_MOCK) {
      try {
        const showtime = await apiRequest<any>(`/v1/showtimes/${showtimeId}`);
        if (showtime && Array.isArray(showtime.seats)) {
          const bp = showtime.basePrice || basePrice;
          return showtime.seats.map((s: any) => {
            let seatPrice = bp;
            const typeStr = (s.seatType || 'REGULAR').toUpperCase();
            if (typeStr === 'VIP') seatPrice += 20000;
            if (typeStr === 'COUPLE') seatPrice = bp * 2 + 20000;

            const isOccupied = s.status === 'BOOKED' || s.status === 'HOLDING';

            return {
              id: s.id,
              seatNumber: s.seatNumber,
              row: s.row,
              col: s.col,
              type: typeStr.toLowerCase() as any,
              price: seatPrice,
              isBooked: isOccupied,
            };
          });
        }
      } catch (err) {
        console.warn(`Backend API getSeatsByShowtime(${showtimeId}) failed, fallback to mockStorage`, err);
      }
    }
    await delay(150);
    return mockStorage.getSeatsByShowtimeId(showtimeId, basePrice);
  },

  async holdSeats(showtimeId: string, seatIds: string[]): Promise<HoldSeatsResult> {
    if (!USE_MOCK) {
      try {
        const result = await apiRequest<HoldSeatsResult>('/v1/bookings/hold', {
          method: 'POST',
          body: JSON.stringify({ showtimeId, seatIds }),
        });
        return result;
      } catch (err) {
        console.warn('Backend API holdSeats failed, falling back to mock booking creation', err);
        throw err;
      }
    }
    // Mock simulation
    await delay(200);
    return {
      bookingId: `mock-hold-${Date.now()}`,
      bookingCode: `CL-${Math.floor(100000 + Math.random() * 900000)}`,
      totalAmount: 180000,
      expiresAt: new Date(Date.now() + 420000).toISOString(),
      expiresSeconds: 420,
    };
  },

  async releaseBooking(bookingId: string): Promise<void> {
    if (!USE_MOCK) {
      try {
        await apiRequest(`/v1/bookings/${bookingId}/release`, {
          method: 'POST',
        });
        return;
      } catch (err) {
        console.warn(`Backend API releaseBooking(${bookingId}) failed`, err);
      }
    }
    await delay(100);
  },

  async createBooking(input: ICreateBookingInput): Promise<IBooking> {
    await delay(300);
    const showtime = mockStorage.getShowtimeById(input.showtimeId);
    if (!showtime) throw new Error('Không tìm thấy thông tin suất chiếu');

    const movie = mockStorage.getMovieById(showtime.movieId);
    if (!movie) throw new Error('Không tìm thấy thông tin phim');

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
    if (!USE_MOCK) {
      try {
        const bookings = await apiRequest<any[]>('/v1/bookings/my-bookings');
        if (Array.isArray(bookings)) {
          return bookings.map((b: any) => ({
            id: b.id,
            userId: b.userId,
            showtimeId: b.showtimeId,
            movieTitle: b.showtime?.movie?.title || 'Phim Chiếu Rạp',
            moviePoster: b.showtime?.movie?.poster || '',
            cinemaName: b.showtime?.room?.cinema?.name || 'CineLight Cinema',
            roomName: b.showtime?.room?.name || 'Phòng chiếu',
            showDate: b.showtime?.startTime ? new Date(b.showtime.startTime).toISOString().split('T')[0] : '',
            showTime: b.showtime?.startTime ? new Date(b.showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
            format: b.showtime?.format === 'IMAX' ? 'IMAX' : (b.showtime?.format === 'THREE_D' ? '3D' : '2D'),
            seats: Array.isArray(b.bookingSeats) ? b.bookingSeats.map((bs: any) => bs.seat?.seatNumber || '') : [],
            totalAmount: b.totalAmount,
            paymentMethod: b.payment?.paymentMethod || 'vietqr',
            paymentStatus: b.status === 'PAID' ? 'completed' : (b.status === 'HOLDING' ? 'pending' : 'failed'),
            bookingCode: b.bookingCode,
            createdAt: b.createdAt,
            ticketCode: b.ticket?.ticketCode,
            ticketQrCode: b.ticket?.qrCode,
            ticketIsUsed: b.ticket?.isUsed,
          }));
        }
      } catch (err) {
        console.warn('Backend API getUserBookings failed, fallback to mockStorage', err);
      }
    }
    await delay(200);
    return mockStorage.getBookings(userId);
  }
};
