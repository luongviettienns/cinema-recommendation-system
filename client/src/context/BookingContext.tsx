import React, { createContext, useContext, useState } from 'react';
import { IShowtime } from '../types/showtime';
import { IMovie } from '../types/movie';
import { ISeat } from '../types/seat';

interface BookingContextType {
  selectedMovie: IMovie | null;
  selectedShowtime: IShowtime | null;
  selectedSeats: ISeat[];
  totalPrice: number;
  setBookingShowtime: (showtime: IShowtime, movie: IMovie) => void;
  toggleSeat: (seat: ISeat) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<IShowtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ISeat[]>([]);

  const setBookingShowtime = (showtime: IShowtime, movie: IMovie) => {
    setSelectedShowtime(showtime);
    setSelectedMovie(movie);
    setSelectedSeats([]); // reset seats when changing showtime
  };

  const toggleSeat = (seat: ISeat) => {
    if (seat.isBooked) return;

    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.seatNumber === seat.seatNumber);
      if (exists) {
        return prev.filter((s) => s.seatNumber !== seat.seatNumber);
      }
      return [...prev, seat];
    });
  };

  const clearBooking = () => {
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <BookingContext.Provider
      value={{
        selectedMovie,
        selectedShowtime,
        selectedSeats,
        totalPrice,
        setBookingShowtime,
        toggleSeat,
        clearBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
