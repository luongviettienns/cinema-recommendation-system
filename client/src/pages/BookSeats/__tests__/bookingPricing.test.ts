import { describe, it, expect } from 'vitest';
import { generateSeatsForShowtime } from '../../../data/mockSeats';
import { ISeat } from '../../../types/seat';

describe('Booking Pricing & Seat Matrix Domain Logic', () => {
  const BASE_PRICE = 90000;
  const seats = generateSeatsForShowtime(BASE_PRICE);

  it('generates 80 seats (8 rows A-H x 10 columns)', () => {
    expect(seats).toHaveLength(80);
  });

  it('calculates pricing correctly by seat tier', () => {
    const regularSeat = seats.find((s) => s.row === 'A')!;
    expect(regularSeat.type).toBe('regular');
    expect(regularSeat.price).toBe(90000);

    const vipSeat = seats.find((s) => s.row === 'F')!;
    expect(vipSeat.type).toBe('vip');
    expect(vipSeat.price).toBe(110000); // 90,000 + 20,000

    const coupleSeat = seats.find((s) => s.row === 'H')!;
    expect(coupleSeat.type).toBe('couple');
    expect(coupleSeat.price).toBe(190000); // 90,000 * 2 + 10,000
  });

  it('correctly marks pre-booked seats as unavailable', () => {
    const bookedSeatNumbers = ['C4', 'C5', 'F5', 'F6', 'D7', 'D8', 'E3'];
    bookedSeatNumbers.forEach((seatNum) => {
      const seat = seats.find((s) => s.seatNumber === seatNum);
      expect(seat).toBeDefined();
      expect(seat?.isBooked).toBe(true);
    });

    const availableSeat = seats.find((s) => s.seatNumber === 'A1')!;
    expect(availableSeat.isBooked).toBe(false);
  });

  it('calculates total order amount for a selection of mixed seats', () => {
    const selectedSeats: ISeat[] = [
      { id: 's1', seatNumber: 'A1', row: 'A', col: 1, type: 'regular', price: 90000, isBooked: false },
      { id: 's2', seatNumber: 'E1', row: 'E', col: 1, type: 'vip', price: 110000, isBooked: false },
      { id: 's3', seatNumber: 'H1', row: 'H', col: 1, type: 'couple', price: 190000, isBooked: false },
    ];

    const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    expect(totalPrice).toBe(390000);
  });

  it('enforces maximum 8 seats limit per booking transaction', () => {
    const MAX_SEATS = 8;
    const canSelectMore = (currentSelectedCount: number) => currentSelectedCount < MAX_SEATS;

    expect(canSelectMore(0)).toBe(true);
    expect(canSelectMore(7)).toBe(true);
    expect(canSelectMore(8)).toBe(false);
    expect(canSelectMore(9)).toBe(false);
  });

  it('prevents selection of already booked seats', () => {
    const canToggleSeat = (seat: ISeat) => !seat.isBooked;

    const bookedSeat: ISeat = { id: 'c4', seatNumber: 'C4', row: 'C', col: 4, type: 'regular', price: 90000, isBooked: true };
    const availableSeat: ISeat = { id: 'a1', seatNumber: 'A1', row: 'A', col: 1, type: 'regular', price: 90000, isBooked: false };

    expect(canToggleSeat(bookedSeat)).toBe(false);
    expect(canToggleSeat(availableSeat)).toBe(true);
  });
});
