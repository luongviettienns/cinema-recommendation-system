import { ISeat, SeatType } from '../types/seat';

export function generateSeatsForShowtime(basePrice: number): ISeat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = 10;
  const seats: ISeat[] = [];

  // Seeded booked seats for realistic cinema feel
  const preBooked = ['C4', 'C5', 'F5', 'F6', 'D7', 'D8', 'E3'];

  rows.forEach((row) => {
    let type: SeatType = 'regular';
    let price = basePrice;

    if (['E', 'F', 'G'].includes(row)) {
      type = 'vip';
      price = basePrice + 20000;
    } else if (row === 'H') {
      type = 'couple';
      price = basePrice * 2 + 10000;
    }

    for (let col = 1; col <= cols; col++) {
      const seatNumber = `${row}${col}`;
      seats.push({
        id: `seat-${seatNumber}`,
        seatNumber,
        row,
        col,
        type,
        price,
        isBooked: preBooked.includes(seatNumber),
      });
    }
  });

  return seats;
}
