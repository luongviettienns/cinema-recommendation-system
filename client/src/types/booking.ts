export interface IBooking {
  id: string;
  userId: string;
  showtimeId: string;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  roomName: string;
  showDate: string;
  showTime: string;
  format: string;
  seats: string[];
  totalAmount: number;
  paymentMethod: 'vietqr' | 'momo' | 'card';
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingCode: string;
  createdAt: string;
}

export interface ICreateBookingInput {
  userId: string;
  showtimeId: string;
  seats: string[];
  totalAmount: number;
  paymentMethod: 'vietqr' | 'momo' | 'card';
}
