export interface IShowtime {
  id: string;
  movieId: string;
  cinemaName: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm, e.g. "10:30"
  format: '2D' | '3D' | 'IMAX';
  language: 'Phụ đề' | 'Lồng tiếng';
  basePrice: number; // Regular seat price
  endTime?: string; // HH:mm
  soldSeatsCount?: number;
  totalSeatsCount?: number;
}
