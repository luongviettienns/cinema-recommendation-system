import { prisma } from '../prisma';
import { SeatType } from '@prisma/client';

export const cinemaService = {
  async getAllCinemas() {
    return prisma.cinema.findMany({
      include: {
        rooms: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  async getCinemaById(id: string) {
    const cinema = await prisma.cinema.findUnique({
      where: { id },
      include: {
        rooms: true,
      },
    });

    if (!cinema) {
      const error: any = new Error('Không tìm thấy cụm rạp');
      error.statusCode = 404;
      error.code = 'CINEMA_NOT_FOUND';
      throw error;
    }

    return cinema;
  },

  async getRoomSeats(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        seats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
    });

    if (!room) {
      const error: any = new Error('Không tìm thấy phòng chiếu');
      error.statusCode = 404;
      error.code = 'ROOM_NOT_FOUND';
      throw error;
    }

    return room;
  },

  async createCinema(data: { name: string; address: string; city?: string; phone?: string; imageUrl?: string }) {
    return prisma.cinema.create({ data });
  },

  async createRoomWithSeats(cinemaId: string, name: string, roomType = 'STANDARD') {
    const room = await prisma.room.create({
      data: {
        cinemaId,
        name,
        roomType,
        totalSeats: 80,
      },
    });

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsToCreate = [];

    for (const row of rows) {
      let seatType: SeatType = SeatType.REGULAR;
      if (['E', 'F', 'G'].includes(row)) seatType = SeatType.VIP;
      if (row === 'H') seatType = SeatType.COUPLE;

      for (let col = 1; col <= 10; col++) {
        seatsToCreate.push({
          roomId: room.id,
          seatNumber: `${row}${col}`,
          row,
          col,
          seatType,
        });
      }
    }

    await prisma.seat.createMany({ data: seatsToCreate });
    return this.getRoomSeats(room.id);
  },
};
