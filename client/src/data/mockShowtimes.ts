import { IShowtime } from '../types/showtime';
import { INITIAL_MOVIES } from './mockMovies';

// Helper to generate dates YYYY-MM-DD
function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateInitialShowtimes(): IShowtime[] {
  const showtimes: IShowtime[] = [];
  const nowShowingMovies = INITIAL_MOVIES.filter((m) => m.isNowShowing);

  const schedules = [
    { time: '10:30', room: 'Phòng 01 - IMAX Laser', format: 'IMAX' as const, lang: 'Phụ đề' as const, price: 130000 },
    { time: '13:45', room: 'Phòng 02 - Dolby Atmos', format: '2D' as const, lang: 'Phụ đề' as const, price: 95000 },
    { time: '16:20', room: 'Phòng 04 - 3D RealD', format: '3D' as const, lang: 'Lồng tiếng' as const, price: 110000 },
    { time: '19:30', room: 'Phòng 01 - IMAX Laser', format: 'IMAX' as const, lang: 'Phụ đề' as const, price: 140000 },
    { time: '21:45', room: 'Phòng 03 - Premium 2D', format: '2D' as const, lang: 'Phụ đề' as const, price: 90000 },
  ];

  const cinemas = [
    'CineLight Landmark 81',
    'CineLight Thủ Đức',
    'CineLight Quận 1'
  ];

  // For next 5 days
  for (let day = 0; day < 5; day++) {
    const dateStr = getDateOffset(day);

    nowShowingMovies.forEach((movie, mIdx) => {
      // Pick 2-3 showtimes per movie per day across cinemas
      const cinema = cinemas[mIdx % cinemas.length];
      const selectedSchedules = mIdx % 2 === 0
        ? [schedules[0], schedules[2], schedules[3]]
        : [schedules[1], schedules[3], schedules[4]];

      selectedSchedules.forEach((sch, sIdx) => {
        showtimes.push({
          id: `st-${movie.id}-d${day}-${sIdx + 1}`,
          movieId: movie.id,
          cinemaName: cinema,
          roomName: sch.room,
          date: dateStr,
          time: sch.time,
          format: movie.formats.includes(sch.format) ? sch.format : '2D',
          language: sch.lang,
          basePrice: sch.price,
        });
      });
    });
  }

  return showtimes;
}
