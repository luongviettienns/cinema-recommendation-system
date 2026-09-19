import { describe, it, expect } from 'vitest';
import { INITIAL_MOVIES } from '../../../data/mockMovies';
import { cleanGenre, matchesGenre } from '../Home';

export const getAvailableCategories = (movies: typeof INITIAL_MOVIES): string[] => {
  const map = new Map<string, string>();
  movies.forEach((m) => {
    m.genre.forEach((g) => {
      const cleaned = cleanGenre(g);
      const lower = cleaned.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, cleaned);
      }
    });
  });
  return ['Tất cả', ...Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'vi'))];
};

describe('Home Page Movie Filtering Logic', () => {
  it('extracts unique genres cleanly without "Phim" prefix', () => {
    const categories = getAvailableCategories(INITIAL_MOVIES);
    expect(categories).toContain('Tất cả');
    expect(categories).toContain('Hành Động');
    expect(categories).toContain('Hài');
    expect(categories).toContain('Khoa Học Viễn Tưởng');
    expect(categories.every((c) => !c.startsWith('Phim '))).toBe(true);
  });

  it('filters correctly when selecting "Hành Động"', () => {
    const actionMovies = INITIAL_MOVIES.filter((m) => matchesGenre(m.genre, 'Hành Động'));
    expect(actionMovies.length).toBeGreaterThan(0);
    expect(actionMovies.every((m) => m.genre.some((g) => g.toLowerCase().includes('hành động')))).toBe(true);
  });

  it('filters correctly when selecting "Hài"', () => {
    const comedyMovies = INITIAL_MOVIES.filter((m) => matchesGenre(m.genre, 'Hài'));
    expect(comedyMovies.length).toBeGreaterThan(0);
    expect(comedyMovies.every((m) => m.genre.some((g) => g.toLowerCase().includes('hài')))).toBe(true);
  });

  it('filters correctly by now_showing vs upcoming', () => {
    const nowShowing = INITIAL_MOVIES.filter((m) => m.isNowShowing);
    const upcoming = INITIAL_MOVIES.filter((m) => !m.isNowShowing);
    expect(nowShowing.length).toBe(10);
    expect(upcoming.length).toBe(6);
  });
});
