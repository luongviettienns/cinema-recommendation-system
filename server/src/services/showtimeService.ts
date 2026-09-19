import { prisma } from '../prisma';
import { MovieFormat } from '@prisma/client';

export class ShowtimeService {
  /**
   * Get showtimes with optional filters (movieId, cinemaId, roomId, date)
   */
  async getShowtimes(filters: {
    movieId?: string;
    cinemaId?: string;
    roomId?: string;
    date?: string;
  }) {
    const where: any = {};

    if (filters.movieId) {
      where.movieId = filters.movieId;
    }

    if (filters.roomId) {
      where.roomId = filters.roomId;
    }

    if (filters.cinemaId) {
      where.room = { cinemaId: filters.cinemaId };
    }

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const showtimes = await prisma.showtime.findMany({
      where,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
            duration: true,
            ageRating: true,
          },
        },
        room: {
          include: {
            cinema: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return showtimes;
  }

  /**
   * Get showtime details by ID with dynamic seat status (AVAILABLE, HOLDING, BOOKED)
   */
  async getShowtimeById(id: string) {
    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: true,
        room: {
          include: {
            cinema: true,
            seats: {
              orderBy: [{ row: 'asc' }, { col: 'asc' }],
            },
          },
        },
      },
    });

    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu');
      (err as any).statusCode = 404;
      (err as any).code = 'SHOWTIME_NOT_FOUND';
      throw err;
    }

    // Fetch active bookings and seat reservations for this showtime
    const now = new Date();
    const activeBookingSeats = await prisma.bookingSeat.findMany({
      where: {
        showtimeId: id,
        booking: {
          OR: [
            { status: 'PAID' },
            {
              status: 'HOLDING',
              expiresAt: { gt: now },
            },
          ],
        },
      },
      include: {
        booking: {
          select: {
            status: true,
            expiresAt: true,
            userId: true,
          },
        },
      },
    });

    const bookedSeatMap = new Map<string, { status: 'BOOKED' | 'HOLDING'; expiresAt?: Date; userId?: string }>();
    for (const bs of activeBookingSeats) {
      bookedSeatMap.set(bs.seatId, {
        status: bs.booking.status === 'PAID' ? 'BOOKED' : 'HOLDING',
        expiresAt: bs.booking.expiresAt,
        userId: bs.booking.userId,
      });
    }

    const seatMatrix = showtime.room.seats.map((seat) => {
      const reservation = bookedSeatMap.get(seat.id);
      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        col: seat.col,
        seatType: seat.seatType,
        status: reservation ? reservation.status : 'AVAILABLE',
        expiresAt: reservation?.expiresAt,
      };
    });

    return {
      ...showtime,
      seats: seatMatrix,
    };
  }

  /**
   * Schedule a new showtime with automatic interval calculation & overlap check
   * - Includes 15-minute room cleaning buffer between movies
   */
  async createShowtime(data: {
    movieId: string;
    roomId: string;
    startTime: string | Date;
    format?: MovieFormat;
    language?: string;
    basePrice?: number;
  }) {
    const movie = await prisma.movie.findUnique({
      where: { id: data.movieId },
    });

    if (!movie) {
      const err = new Error('Không tìm thấy phim');
      (err as any).statusCode = 404;
      (err as any).code = 'MOVIE_NOT_FOUND';
      throw err;
    }

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      const err = new Error('Không tìm thấy phòng chiếu');
      (err as any).statusCode = 404;
      (err as any).code = 'ROOM_NOT_FOUND';
      throw err;
    }

    const start = new Date(data.startTime);
    // End time = start + movie duration (minutes) + 15 minutes cleaning/prep buffer
    const durationWithBufferMinutes = movie.duration + 15;
    const end = new Date(start.getTime() + durationWithBufferMinutes * 60 * 1000);

    // Overlap validation: check if room is occupied during [start, end)
    const overlap = await prisma.showtime.findFirst({
      where: {
        roomId: data.roomId,
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
      include: { movie: true },
    });

    if (overlap) {
      const err = new Error(
        `Phòng chiếu đã có suất chiếu khác: "${overlap.movie.title}" (${overlap.startTime.toLocaleTimeString('vi-VN')} - ${overlap.endTime.toLocaleTimeString('vi-VN')}) bao gồm 15 phút dọn phòng.`
      );
      (err as any).statusCode = 409;
      (err as any).code = 'SHOWTIME_OVERLAP';
      throw err;
    }

    const showtime = await prisma.showtime.create({
      data: {
        movieId: data.movieId,
        roomId: data.roomId,
        startTime: start,
        endTime: end,
        format: data.format || 'TWO_D',
        language: data.language || 'Phụ đề Tiếng Việt',
        basePrice: data.basePrice || 90000,
      },
      include: {
        movie: true,
        room: {
          include: { cinema: true },
        },
      },
    });

    return showtime;
  }

  /**
   * Delete a showtime (only if no paid bookings exist)
   */
  async deleteShowtime(id: string) {
    const paidBooking = await prisma.booking.findFirst({
      where: {
        showtimeId: id,
        status: 'PAID',
      },
    });

    if (paidBooking) {
      const err = new Error('Không thể xóa suất chiếu đã có khách thanh toán vé');
      (err as any).statusCode = 400;
      (err as any).code = 'SHOWTIME_HAS_PAID_BOOKINGS';
      throw err;
    }

    // Delete any holding or cancelled bookings/bookingSeats first
    await prisma.bookingSeat.deleteMany({ where: { showtimeId: id } });
    await prisma.booking.deleteMany({ where: { showtimeId: id } });

    await prisma.showtime.delete({
      where: { id },
    });

    return { message: 'Đã xóa suất chiếu thành công' };
  }
}

export const showtimeService = new ShowtimeService();
