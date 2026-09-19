import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tmdbService, TMDB_CONFIG } from '../tmdbService';

describe('TMDb Service & API Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('contains valid TMDb API credentials and CDN endpoints', () => {
    expect(TMDB_CONFIG.API_KEY).toBe('d57f98353cd138d04009d9b056243e9e');
    expect(TMDB_CONFIG.ACCESS_TOKEN).toBeDefined();
    expect(TMDB_CONFIG.ACCESS_TOKEN.length).toBeGreaterThan(50);
    expect(TMDB_CONFIG.BASE_URL).toBe('https://api.themoviedb.org/3');
    expect(TMDB_CONFIG.DEFAULT_LANGUAGE).toBe('vi-VN');
    expect(TMDB_CONFIG.IMAGE_W780).toContain('image.tmdb.org/t/p/w780');
  });

  it('fetchTmdb includes Bearer token and api_key in request', async () => {
    const mockResponse = { results: [{ id: 101, title: 'Test Movie' }] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const data = await tmdbService.fetchTmdb<{ results: any[] }>('movie/now_playing', { page: '1' });
    expect(data.results).toHaveLength(1);
    expect(data.results[0].title).toBe('Test Movie');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];
    expect(calledUrl.toString()).toContain('api_key=d57f98353cd138d04009d9b056243e9e');
    expect(calledOptions.headers.Authorization).toContain('Bearer ');
  });

  it('getNowPlaying queries movie/now_playing with vi-VN language', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    global.fetch = fetchMock;

    await tmdbService.getNowPlaying(2);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl.toString()).toContain('movie/now_playing');
    expect(calledUrl.toString()).toContain('language=vi-VN');
    expect(calledUrl.toString()).toContain('page=2');
  });

  it('searchMovies queries search/movie with query parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    global.fetch = fetchMock;

    await tmdbService.searchMovies('Spider-Man', 1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl.toString()).toContain('search/movie');
    expect(calledUrl.toString()).toContain('query=Spider-Man');
  });

  it('handles API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(tmdbService.fetchTmdb('movie/now_playing')).rejects.toThrow('TMDb API Error: 401 Unauthorized');
  });
});
