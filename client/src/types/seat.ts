export type SeatType = 'regular' | 'vip' | 'couple';

export type SeatStatus = 'available' | 'selected' | 'booked';

export interface ISeat {
  id: string;
  seatNumber: string; // e.g. "A1", "F5"
  row: string; // "A" - "H"
  col: number; // 1 - 10
  type: SeatType;
  price: number; // VND
  isBooked: boolean;
}
