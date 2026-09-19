import { describe, it, expect } from 'vitest';
import { generateInitialShowtimes } from '../../../data/mockShowtimes';
import { INITIAL_MOVIES } from '../../../data/mockMovies';

describe('Schedule Matrix Logic Tests', () => {
  const showtimes = generateInitialShowtimes();

  it('generates rich mock showtimes for multiple days and cinemas', () => {
    expect(showtimes.length).toBeGreaterThan(0);
    const cinemas = Array.from(new Set(showtimes.map((s) => s.cinemaName)));
    expect(cinemas).toContain('CineLight Landmark 81');
    expect(cinemas).toContain('CineLight Thủ Đức');
  });

  it('groups showtimes by movie and formats accurately', () => {
    const today = showtimes[0].date;
    const todayShows = showtimes.filter((s) => s.date === today);

    const movieMap = new Map<string, typeof todayShows>();
    todayShows.forEach((st) => {
      if (!movieMap.has(st.movieId)) movieMap.set(st.movieId, []);
      movieMap.get(st.movieId)!.push(st);
    });

    expect(movieMap.size).toBeGreaterThan(0);

    // Each grouped movie has valid movies in catalog
    movieMap.forEach((shows, movieId) => {
      const movie = INITIAL_MOVIES.find((m) => m.id === movieId);
      expect(movie).toBeDefined();
      expect(shows.every((s) => s.time && s.roomName)).toBe(true);
    });
  });

  it('filters showtimes by specific cinema', () => {
    const targetCinema = 'CineLight Landmark 81';
    const landmarkShows = showtimes.filter((s) => s.cinemaName === targetCinema);
    expect(landmarkShows.length).toBeGreaterThan(0);
    expect(landmarkShows.every((s) => s.cinemaName === targetCinema)).toBe(true);
  });

  it('contains valid formats and language codes', () => {
    const formats = Array.from(new Set(showtimes.map((s) => s.format)));
    expect(formats.some((f) => ['2D', '3D', 'IMAX'].includes(f))).toBe(true);

    const languages = Array.from(new Set(showtimes.map((s) => s.language)));
    expect(languages.some((l) => ['Phụ đề', 'Lồng tiếng'].includes(l))).toBe(true);
  });

  it('loads showtimes from mockStorage and matches today local date', async () => {
    const { mockStorage } = await import('../../../services/mockStorage');
    const storageShowtimes = mockStorage.getShowtimes();
    expect(storageShowtimes.length).toBeGreaterThan(0);

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayShows = storageShowtimes.filter((s) => s.date === today);
    expect(todayShows.length).toBeGreaterThan(0);
  });
});
